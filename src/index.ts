import { Client, GuildMember, PartialGuildMember, Speaking, VoiceChannel, VoiceConnection } from 'discord.js';

import * as dotenv from 'dotenv';
dotenv.config();
const PREFIX = '!';

const client: Client = new Client();

client.on('ready', () => {
    console.log("Bot is alive");
});

client.on('message', async (message) => {
    console.log(message);
    if(message.author.bot) return;
    if(message.content.startsWith(PREFIX)) {
        const [CMD_NAME, ...args] = message.content.trim().substring(PREFIX.length).split("\n");
        switch(CMD_NAME) {
            case 'join':
                const channel = message.member?.voice.channel;
                if (!channel) return message.reply("Please join a voice channel to invite the bot");
                channel.join().then((connection: VoiceConnection) => {
                    console.log(connection);
                }).catch(error => {
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
            break;
        }
    }
});

client.on('guildMemberSpeaking', (member: GuildMember | PartialGuildMember, speech: Readonly<Speaking>) => {

})

client.login(process.env.DISCORD_BOT_TOKEN);