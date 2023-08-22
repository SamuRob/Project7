const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');

const port = process.env.PORT || 4000;

const app = express();

// Use body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    // Display a form for entering a URL
    const form = `
        <form action="/" method="post">
            <label for="url">Enter URL to scrape:</label>
            <input type="text" id="url" name="url" required>
            <button type="submit">Scrape</button>
        </form>
    `;
    res.send(form);
});

app.post('/', (req, res) => {
    const url = req.body.url; // input URL
    
    axios.get(url)
        .then(response => {
            const $ = cheerio.load(response.data);
            
            // selectors to target what parts to scrape
            const title = $('title').text();
            const headings = $('h1, h2, h3').map((index, element) => $(element).text()).get().join('<br>');
            const paragraphs = $('p').map((index, element) => $(element).text()).get().join('<br>');
            
            // make the data more readable
            const csvData = `Title:${title}<br>Headings:${headings}<br>Paragraphs:${paragraphs}`;
            
            // output scraped data onto site
            res.send(csvData);
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
