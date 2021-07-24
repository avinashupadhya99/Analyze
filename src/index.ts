import { Client } from 'discord.js';

import * as dotenv from 'dotenv';
dotenv.config();

const client: Client = new Client();

client.on('ready', async () => {
    console.log("Bot is alive");
});

client.on('message', (message) => {
    console.log(message);
});

client.login(process.env.DISCORD_BOT_TOKEN);