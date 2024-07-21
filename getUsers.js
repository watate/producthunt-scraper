const puppeteer = require('puppeteer');

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
  const items = await page.$$('div[data-test="homepage-section-0"] > div');

  for (let item of items) {
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

        // Wait for the comments section to load
        await page.waitForSelector('#comments');

        // Find the maker's profile link and click it
        const makerProfileLink = await page.$('a[data-test^="user-image-link-"]');
        if (makerProfileLink) {
          await Promise.all([
            makerProfileLink.click(),
            page.waitForNavigation({ waitUntil: 'networkidle0' })
          ]);

          // Log the URL of the maker's profile page
          console.log(`Navigated to maker's profile page: ${page.url()}`);

          // Extract and print all social links
          const socialLinks = await page.$$eval('a[data-test="user-link"]', links =>
            links.map(link => ({ text: link.innerText, href: link.href }))
          );

          console.log('Social Links:', socialLinks);

        } else {
          console.log('Maker profile link not found.');
        }

      } else {
        console.log('Title link not found.');
      }
    } catch (error) {
      console.error(`Error processing item: ${error.message}`);
    }
  }

  await browser.close();
})();