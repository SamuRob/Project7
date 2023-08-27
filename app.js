const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');

const port = process.env.PORT || 4000;

const app = express();

// Use body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    // URL entering form
    const form = `
        <form action="/" method="post">
            <label for="url">Enter URL to scrape:</label>
            <input type="text" id="url" name="url" required>
            
            <br>
            <label for="attributes">Select attributes to scrape:</label>
            <select id="attributes" name="attributes" multiple>
                <option value="title">Title</option>
                <option value="headings">Headings</option>
                <option value="paragraphs">Paragraphs</option>
                <option value="links">Links</option>
                <option value="images">Images</option>
                <!-- Add more options for other attributes -->
            </select>
            
            <button type="submit">Scrape</button>
        </form>
    `;
    res.send(form);
});


app.post('/', (req, res) => {
    const url = req.body.url;
    const selectedAttributes = req.body.attributes; // array to store selected attributes
    
    axios.get(url)
        .then(response => {
            const $ = cheerio.load(response.data);
            let scrapedData = '';

            if (selectedAttributes.includes('title')) {
                const title = $('title').text();
                scrapedData += `Title: ${title}<br>`;
            }

            if (selectedAttributes.includes('headings')) {
                const headings = $('h1, h2, h3').map((index, element) => $(element).text()).get().join('<br>');
                scrapedData += `Headings: ${headings}<br>`;
            }

            if (selectedAttributes.includes('paragraphs')) {
                const paragraphs = $('p').map((index, element) => $(element).text()).get().join('<br>');
                scrapedData += `Paragraphs: ${paragraphs}<br>`;
            }

            if (selectedAttributes.includes('links')) {
                const links = $('a').map((index, element) => $(element).attr('href')).get().join('<br>');
                scrapedData += `Links: ${links}<br>`;
            }

            if (selectedAttributes.includes('images')) {
                const images = $('img').map((index, element) => $(element).attr('src')).get().join('<br>');
                scrapedData += `Images: ${images}<br>`;
            }

            // Add more conditions for other attributes

            if (scrapedData === '') {
                res.send('No attributes selected for scraping.');
            } else {
                res.send(scrapedData);
            }
        })
        .catch(err => {
            console.error(err);
            res.send('An error occurred while scraping and formatting data.');
        });
});

// outpyt connection
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
