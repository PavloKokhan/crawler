#!/usr/bin/env node

import * as urlParser from "url";
import yargs from "yargs";
import fetch from "node-fetch"
import jquery from "jquery";
import {JSDOM} from "jsdom"
const { window } = new JSDOM( "" );
const jQuery = jquery(window);

const options = yargs(process.argv.slice(2)).usage("Usage: crawl <url> <word>")
  .demandCommand(2)
  .argv;

const getUrl = (link, host, protocol) => {
  if (link.includes("http")) {
    return link;
  } else if (link.startsWith("/")) {
    return `${protocol}//${host}${link}`;
  } else {
    return `${protocol}//${host}/${link}`;
  }
};

const visitedUrls = {};
const url = options._[0];
const word = options._[1];

const { host, protocol } = urlParser.parse(url);

const crawl = async ({ url }) => {
  if (visitedUrls[url]) return;
  visitedUrls[url] = true;

  const parser = urlParser.parse(url);
  if (parser.hash) return;

  const response = await fetch(url).catch(err => (() => {})());
  if (!response) return
  const html = await response.text();

  if (html.toLowerCase().includes(word.toLowerCase())) {
    jQuery('*:not(script, style)', html).contents().filter(function () {
      if (this.nodeType === 3 && this.textContent.toLowerCase().includes(word.toLowerCase())) console.log(`${url} => ${this.textContent.trim()}`)
    });
  }

  const links = jQuery('a', html).map((i, link) => {
    return link.href
  }).get();

  links
    .filter((link) => {
      const linkHostname = urlParser.parse(link).hostname;

      return (!linkHostname) || host && link.includes(host);
    })
    .forEach((link) => {
      crawl({
        url: getUrl(link, host, protocol),
      });
    });
}

crawl({url})