const axios = require('axios')
require('dotenv').config()
const fetch = require('node-fetch');
const fs = require('fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

//gaules, pasha, fallen, niko, waveigl, s1mple, monesy, vini, liminha, apoka, deercherup, nowayzao, sks
const channelsId = ['181077473', '47207941', '37287763', '87477627', '173162545', '60917582', '218726370', '122460015', '77573531', '112618532', '245622027', '195680504', '191828846']

function main() {
  channelsId.forEach(channelId => {
    getClips(channelId)
  })
}

function getClips(channelId) {
  const date = subtractMinutes(30).toISOString().split('.')[0] + 'Z'

  return axios({
    url: `https://api.twitch.tv/helix/clips?broadcaster_id=${channelId}&started_at=${date}`,
    headers: {
      'Authorization': 'Bearer ' + process.env.TWITCH_TOKEN,
      'Client-Id': process.env.TWITCH_CLIENT_ID
    }
  }).then(async (response) => {
    const clips = response.data.data

    if (clips.length > 0) {
      const getMostViewedClip = clips.reduce(function (prev, current) {
        return (prev.view_count > current.view_count) ? prev : current
      })
      // console.log(getMostViewedClip);
      const clipName = getMostViewedClip.broadcaster_name + '-' + getMostViewedClip.view_count
      const clipUrl = getMostViewedClip.thumbnail_url.replace('-preview-480x272.jpg', '.mp4');

      await downloadClip(clipUrl, clipName)

    } else {
      console.log('No clips found at channelId: ' + channelId);
    }

  }).catch(error => {
    console.log(error)
  })
}

async function downloadClip(clipUrl, clipName) {
  const response = await fetch(clipUrl);
  const buffer = await response.buffer();

  fs.writeFile(`./src/clips/${clipName}.mp4`, buffer, () =>
    console.log('Clip downloaded successfully!'));

  const command = await ffmpeg(`./src/clips/${clipName}.mp4`)
    .input('./src/img/logo.png')
    .complexFilter([
      `overlay=10:10`,
    ])
    .saveToFile(`./src/clips/${clipName}-edit.mp4`)
    .on("error", (err) => {
      console.log(err);
    })
    .on("end", () => {
      console.log("Changes made to the clip successfully.");
      fs.unlink(`./src/clips/${clipName}.mp4`, function (err) {
        if (err) throw err;
        console.log('Old clip deleted!');
      });
    });
}

function subtractMinutes(numOfMinutes, date = new Date()) {
  date.setMinutes(date.getMinutes() - numOfMinutes);
  return date;
}

main()