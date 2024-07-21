const puppeteer = require('puppeteer');

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto('https://www.producthunt.com/');

  // Set screen size
  await page.setViewport({width: 1080, height: 1024});

  // Select the div with data-test="homepage-section-0"
  const section = await page.$('div[data-test="homepage-section-0"]');

  // Select items inside this section
  const items = await section.$$('div[data-test^="post-item-"]'); // Selecting all divs with data-test starting with "post-item-"

  for (let item of items) {
    const title = await item.$eval('a[data-test^="post-name-"]', el => el.innerText);
    const voteCount = await item.$eval('button[data-test="vote-button"] div.text-12', el => el.innerText);
    console.log(`Title: ${title}, Vote Count: ${voteCount}`);
  }

  await browser.close();
})();