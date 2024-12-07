// const path = require('path')
const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const filesDirectory = path.join(__dirname, '..', 'test_dir');

// app.use(express.static(path.join(__dirname, 'public')));


// Route to render the tag explorer page
// Route to render the tag explorer page
router.get("/", async  (req, res) => {
     // Query to get all files
     const sqlFiles = 'SELECT f.file_id, f.file_path, GROUP_CONCAT(DISTINCT tv.value_id) AS tag_values, GROUP_CONCAT(DISTINCT t.tag_id) AS tag_names FROM files f LEFT JOIN file_tags ft ON f.file_id = ft.file_id LEFT JOIN tag_values tv ON ft.value_id = tv.value_id LEFT JOIN tags t ON tv.tag_id = t.tag_id GROUP BY f.file_id, f.file_path ORDER BY f.file_path ASC;';
     db.query(sqlFiles, async (err, fileResults) => {
         if (err) {
             console.error(err);
             return res.status(500).send("Database error");
         }

         // console.log(JSON.stringify(tagsWithValues, null, 2));
         // console.log(JSON.stringify(fileResults, null, 2));
         const filesWithMetadata = fileResults.map(file => {
             const filePath = path.join(filesDirectory, file.file_path.split('/').pop()); // Assuming the `file_path` is relative
             const stats = fs.statSync(filePath); // Get file metadata
             return {
                 ...file,
                 size: stats.size, // File size in bytes
                 modifiedDate: stats.mtime // Last modified date
             };
         });

         try {
            //  const [tagValuesResponse] = await Promise.all([
            //      axios.get('http://localhost:3000/tag_values')// Fetching default tags from the new API
            //  ]);
            //  const tagValues = tagValuesResponse.data;
            //  res.render("tag-explorer", { tags: tagsWithValues, files: filesWithMetadata, tagValues: tagValues });
    //      } catch (error) {
    //          console.error(error);
    //          res.status(500).send('Server error');
    //      }
    //      // Render the view with both tags and files
         
    //  });
  
    // try {
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
        res.render('tag-explorer', {  files: filesWithMetadata , tags, tagValues , defaultTags});
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }

});
});
router.get("/autocomplete", async (req, res) => {
  try {
    const tagsResponse = await axios.get('http://localhost:3000/tags');
    
    // Extract the necessary information (tag name, id, and description)
    const tagDetails = tagsResponse.data.map(tag => ({
      id: tag.id,
      name: tag.tag_name,   // Assuming tag_name is the field for the name
      description: tag.description // Assuming description is another field for each tag
    }));
    
    res.json(tagDetails);  // Return the full tag details in the response
  } catch (error) {
    console.error("Error fetching autocomplete tags:", error);
    res.status(500).send("Server error");
  }
});

router.get('/open/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(filesDirectory, fileName);
    // console.log(fileName+ "path:" + filePath);
    // Check if the file exists before trying to open it
    if (fs.existsSync(filePath)) {
      const openCommand = process.platform === 'win32' ? '' :
                          process.platform === 'darwin' ? 'open' : 'xdg-open';
    //   console.log(openCommand+ "path:" + filePath);
      exec(`${openCommand} "${filePath}"`, (error) => {
        if (error) {
          console.error(`Error opening file: ${error}`);
          return res.status(500).send('Error opening file');
        }
        res.send(`Opening file: ${fileName}`);
      });
    } else {
      res.status(404).send('File not found');
    }
  });


module.exports = router;
