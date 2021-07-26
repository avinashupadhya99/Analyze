import { Client, GuildMember, PartialGuildMember, Speaking, VoiceChannel, VoiceConnection } from 'discord.js';
import {sdk} from 'symbl-node';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import ffmpeg from 'ffmpeg';

import * as dotenv from 'dotenv';
dotenv.config();
const PREFIX = '!';

const client: Client = new Client();

let audioStreams: { [key: string]: ReadableStream; } = {};
let symblAIconnections: {[key: string]: any} = {};

client.on('ready', () => {
    console.log("Bot is alive");
});

client.on('message', async (message) => {
    if(message.author.bot) return;
    if(message.content.startsWith(PREFIX)) {
        const [CMD_NAME, ...args] = message.content.trim().substring(PREFIX.length).split(" ");
        switch(CMD_NAME) {
            case 'join':
                const channel = message.member?.voice.channel;
                if (!channel) return message.reply("Please join a voice channel to invite the bot");
                channel.join().then((connection: VoiceConnection) => {                    
                    const meetingID = uuidv4();
                    console.log(meetingID);
                    // Go through member in the voice channel
                    channel.members.forEach(async (member: GuildMember) => {
                        // Ignore bots
                        if(!member.user.bot) {
                            // Create a symbl connection for each user on the call
                            symblAIconnections[member.id] = await sdk.startRealtimeRequest({
                                meetingID,
                                insightTypes: ['action_item', 'question'],
                                config: {
                                    meetingTitle: args[0],
                                    confidenceThreshold: 0,
                                    timezoneOffset: 480, // Offset in minutes from UTC
                                    languageCode: 'en-US',
                                    sampleRateHertz: 48000
                                },
                                speaker: {
                                    userId: 'avinashupadhya99@gmail.com', // TODO: Remove or change
                                    name: message.author.username
                                },
                                handlers: {
                                    onSpeechDetected: (data: any) => {
                                        if (data) {
                                            const {punctuated} = data
                                            console.log('Live: ', punctuated && punctuated.transcript)
                                            console.log('');
                                        }
                                        console.log('onSpeechDetected ', JSON.stringify(data, null, 2));
                                    },
                                    /**
                                     * When processed messages are available, this callback will be called.
                                     */
                                    onMessageResponse: (data: any) => {
                                        console.log('onMessageResponse', JSON.stringify(data, null, 2))
                                    },
                                    /**
                                     * When Symbl detects an insight, this callback will be called.
                                     */
                                    onInsightResponse: (data: any) => {
                                        console.log('onInsightResponse', JSON.stringify(data, null, 2))
                                    },
                                    /**
                                     * When Symbl detects a topic, this callback will be called.
                                     */
                                    onTopicResponse: (data: any) => {
                                        console.log('onTopicResponse', JSON.stringify(data, null, 2))
                                    },
                                    /**
                                     * When trackers are detected, this callback will be called.
                                     */
                                    onTrackerResponse: (data: any) => {
                                        console.log('onTrackerResponse', JSON.stringify(data, null, 2))
                                    },
                                }
                            });
                            console.log(symblAIconnections[member.id].conversationId);
                            // Create audio stream for each user
                            audioStreams[member.id] = connection.receiver.createStream(message.author, { mode: 'opus', end: 'manual' });
                            audioStreams[member.id].on('data', (data: any) => {
                                // Send contents of the audio stream to symbl.ai
                                symblAIconnections[member.id].sendAudio(data);
                            });                            
                        }
                    });
                }).catch((error: any) => {
                    console.error(error);
                    return message.reply("Something went wrong");
                });
            break;
            case 'leave':
                if(!message.guild?.voice?.connection)
                    return;
                // Get the client's voiceConnection
                let clientVoiceConnection = message.guild?.voice?.connection;
                clientVoiceConnection.disconnect();
                Object.keys(audioStreams).forEach((user: string) => {
                    audioStreams[user].destroy();
                    delete audioStreams[user];
                    symblAIconnections[user].stop();
                    delete symblAIconnections[user];
                });
            break;
        }
    }
});

(async () => {
    try {
        await sdk.init({
            appId: process.env.SYMBL_APP_ID,
            appSecret: process.env.SYMBL_APP_SECRET,
            basePath: 'https://api.symbl.ai'
        });
        client.login(process.env.DISCORD_BOT_TOKEN);
    } catch (symblError) {
        console.error(symblError);
    }
})()
