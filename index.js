const JSZip = require("jszip");

const COMPRESSION_OPTIONS = {
  type: "nodebuffer",
  compression: "DEFLATE",
  compressionOptions: {
    level: 9
  }
};

module.exports = class ZipModifier {
  constructor() {

  }

  async loadZip(zipFileContents) {
    this.zipData = await readZipFromData(zipFileContents);
  }

  async modifyFiles (predicate, modifier) {
    await this.iterateAllFiles([{
        test: predicate,
        modifier
    }])
  }

  async iterateAllFiles (modifiers) {
    await itearateZip(this.zipData, modifiers);
  }

  async exportZip() {
    return this.zipData.generateAsync(COMPRESSION_OPTIONS);
  }
}

async function readZipFromData(data) {
  return await new JSZip().loadAsync(data, { createFolders: true });
}

async function itearateZip(zipData, modifiers = []) {
  const modifiersData = [].concat(modifiers);
  const arr = [];

  zipData.forEach(function(relativePath, file) {
    arr.push({ relativePath, file });
  });

  await arr.reduce(async (acc, { relativePath, file }) => {
    await acc;
    console.log("iterating", relativePath);
    // check if a modifier requires this file
    const filteredModifiers = modifiersData.filter(
      ({ test }) => !!test(relativePath)
    );
    if (filteredModifiers.length) {
      console.log("modifying", relativePath);
      const initialString = await file.async("string");
      // run modifiers
      const result = filteredModifiers.reduce(
        (string, { modifier }) => modifier(string),
        initialString
      );
      if (result) {
        // update zip file
        zipData.file(relativePath, result);
      } else {
        zipData.remove(relativePath);
      }
    }
  }, Promise.resolve());
}
