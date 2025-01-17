const puppeteer = require('puppeteer');
const fs = require('fs');
const fastcsv = require('fast-csv');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the Product Hunt homepage
  await page.goto('https://www.producthunt.com/');

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  // Wait for the homepage section to load
  await page.waitForSelector('div[data-test="homepage-section-0"]');

  // Select all items in the homepage section
  let items = await page.$$('div[data-test="homepage-section-0"] > div');

  // Array to store CSV data
  const csvData = [];

  for (let i = 0; i < items.length; i++) {
    // Re-select items because navigating away and back to the page makes the DOM references stale
    items = await page.$$('div[data-test="homepage-section-0"] > div');

    const item = items[i];
    try {
      // Extract the title
      const title = await item.$eval('a[data-test^="post-name-"]', el => el.innerText);
      const voteCount = await item.$eval('button[data-test="vote-button"] div.text-12', el => el.innerText);
      console.log(`Title: ${title}, Vote Count: ${voteCount}`);

      // Click on the title to navigate to the post page
      const titleLink = await item.$('a[data-test^="post-name-"]');
      if (titleLink) {
        await Promise.all([
          titleLink.click(),
          page.waitForNavigation({ waitUntil: 'networkidle0' })
        ]);

        // Wait for the upvoters section to load
        await page.waitForSelector('a[data-test^="user-image-link-"]');

        // Extract the URLs of upvoters
        const upvoterUrls = await page.$$eval('a[data-test^="user-image-link-"]', links =>
          links.map(link => link.href)
        );

        console.log(`Upvoter URLs for ${title}:`, upvoterUrls);

        // Add data to CSV array
        upvoterUrls.forEach(url => {
          csvData.push({ title: title, url: url });
        });

        // Write data to CSV file
        const writeStream = fs.createWriteStream('upvoter_urls.csv', { flags: 'a' });
        const csvStream = fastcsv.format({ headers: i === 0 });
        csvStream.pipe(writeStream).on('end', () => process.exit());

        csvData.forEach(row => {
          csvStream.write(row);
        });

        csvStream.end();

        // Clear the CSV data array for the next product
        csvData.length = 0;

        // Navigate back to the homepage
        await page.goto('https://www.producthunt.com/', { waitUntil: 'networkidle0' });

      } else {
        console.log('Title link not found.');
      }
    } catch (error) {
      console.error(`Error processing item: ${error.message}`);
    }
  }

  await browser.close();
})();
