const { request } = require("gaxios");

const fs = require("fs");

const svaraClient = function(url, opts) {
  return request(
    Object.assign(
      {
        baseURL: "https://api.svara.id/v1",
        headers: {
          authorization: `Bearer ${process.env.TOKEN}`
        },
        url
      },
      opts
    )
  );
};

async function getAllContentById(id, offset) {
  return svaraClient(`/radios/${id}/contents?limit=1&offset=${offset}`);
}

async function fetchAudio(content) {
  const { audio } = content;
  return svaraClient(audio, { responseType: "stream" });
}

async function fetchCoverart(content) {
  const { images } = content;
  return request({ url: images.image640, responseType: "stream" });
}

async function main() {
  let hasNext = true;
  let offset = 0;
  while (hasNext) {
    const { data } = await getAllContentById(process.env.RADIO_ID, offset);
    const { dataList, hasNext: hasNextData } = data;

    for (const content of dataList) {
      const audio = await fetchAudio(content);
      audio.data.pipe(
        fs.createWriteStream(
          `audio/${content.name}.${content.audio.split(".").reverse()[0]}`
        )
      );
      const coverart = await fetchCoverart(content);
      coverart.data.pipe(
        fs.createWriteStream(
          `coverart/${content.name}.${content.coverArt.split(".").reverse()[0]}`
        )
      );
    }

    console.log(`offset ${offset} done`);
    hasNext = hasNextData;
    offset += 1;
  }
}

main();
