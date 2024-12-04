const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');

// Route to render the tag explorer page
router.get("/", async (req, res) => {

    try {
        const [tagsResponse, tagValuesResponse,defaultTagsResponse] = await Promise.all([
            axios.get('http://localhost:3000/tags'),
            axios.get('http://localhost:3000/tag_values'),
            axios.get('http://localhost:3000/default-tags') // Fetching default tags from the new API

        ]);

        const tags = tagsResponse.data;
        const tagValues = tagValuesResponse.data;
        const defaultTags = defaultTagsResponse.data;

        console.log("tags:", tags); // Logs the full tags array
        console.log("tag-values:", tagValues); // Logs the full tagValues array
        console.log("default tags:", defaultTags); // Logs the full defaultTags array
        res.render('tag-explorer', { tags, tagValues , defaultTags});
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});
router.get("/autocomplete", async (req, res) => {
    try {
        const tagsResponse = await axios.get('http://localhost:3000/tags');
        const tagNames = tagsResponse.data.map(tag => tag.tag_name); // Extract tag names only
        res.json(tagNames);
    } catch (error) {
        console.error("Error fetching autocomplete tags:", error);
        res.status(500).send("Server error");
    }
});
module.exports = router;
