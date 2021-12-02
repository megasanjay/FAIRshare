"use strict";

import fs from "fs-extra";
import path from "path";
import { app } from "@electron/remote";
import { defineStore } from "pinia";
import CryptoJS from "crypto-js";

const USER_PATH = app.getPath("home");
const TOKEN_STORE_PATH = path.join(
  USER_PATH,
  ".sodaforcovid19research",
  "accessTokens.json"
);

// will change to use an actual secret key
const SECRET_KEY = "TEST_SECRET_KEY";

const encrypt = async (plainToken) => {
  return CryptoJS.AES.encrypt(plainToken, SECRET_KEY).toString();
};

const decrypt = async (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// function to create the dataset store file in the user path
const createFile = async () => {
  fs.ensureFileSync(TOKEN_STORE_PATH);
  fs.writeJsonSync(TOKEN_STORE_PATH, {});
};

const loadFile = async () => {
  const exists = await fs.pathExists(TOKEN_STORE_PATH);

  if (!exists) {
    createFile();
    return {};
  } else {
    try {
      let allTokens = fs.readJsonSync(TOKEN_STORE_PATH);
      return allTokens;
    } catch (err) {
      console.error(err);
      return {};
    }
  }
};

export const useTokenStore = defineStore({
  id: "TokenStore",
  state: () => ({
    accessTokens: {},
  }),
  actions: {
    async loadTokens() {
      try {
        this.accessTokens = await loadFile();
      } catch (error) {
        console.error(error);
      }
    },
    // save an encrypted version of the token in the store also save it to the file.
    async saveToken(key, value) {
      this.accessTokens[key] = await encrypt(value);
      await this.syncTokens();
    },
    async writeDatasetsToFile() {
      fs.ensureFileSync(TOKEN_STORE_PATH);
      fs.writeJsonSync(TOKEN_STORE_PATH, this.accessTokens);
    },
    async syncTokens() {
      this.writeDatasetsToFile();
    },
    // decrypt the token and return it
    async getToken(key) {
      console.log("this.accessTokens: ", this.accessTokens)
      if (key in this.accessTokens) {
        return await decrypt(this.accessTokens[key]);
      } else {
        console.log("?????????")
        return "NO_TOKEN_FOUND";
      }
    },

    async deleteToken(key) {
      delete this.accessTokens[key]
      await this.syncTokens();
      console.log("now accessTokens: ", this.accessTokens)
    }
  },
});
