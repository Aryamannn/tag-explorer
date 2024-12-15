const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const filesDirectory = path.join(__dirname, '..', 'test_dir');

// Helper Functions
function getFileType(filePath) {
    try {
        if (!filePath) return 'Unknown';
        const extension = path.extname(filePath).toLowerCase().slice(1);
        const fileTypes = {
            pdf: 'PDF Document',
            doc: 'Word Document',
            docx: 'Word Document',
            xls: 'Excel Spreadsheet',
            xlsx: 'Excel Spreadsheet',
            ppt: 'PowerPoint Presentation',
            pptx: 'PowerPoint Presentation',
            txt: 'Text File',
            jpg: 'JPEG Image',
            jpeg: 'JPEG Image',
            png: 'PNG Image',
            gif: 'GIF Image',
            zip: 'Compressed File',
            rar: 'Compressed File',
            mp4: 'Multimedia Video'
        };
        return fileTypes[extension] || 'Unknown File Type';
    } catch (err) {
        console.error('Error getting file type:', err);
        return 'Unknown File Type';
    }
}

function safeGetFileStats(filePath) {
    try {
        if (!filePath || !fs.existsSync(filePath)) {
            return {
                exists: false,
                error: 'File not found',
                size: 0,
                modifiedDate: null,
                fileType: 'Unknown'
            };
        }
        const stats = fs.statSync(filePath);
        return {
            exists: true,
            size: stats.size,
            modifiedDate: stats.mtime,
            fileType: getFileType(filePath),
            error: null
        };
    } catch (err) {
        console.error(`Error getting file stats for ${filePath}:`, err);
        return {
            exists: false,
            error: err.message,
            size: 0,
            modifiedDate: null,
            fileType: 'Unknown'
        };
    }
}

async function makeAPIRequest(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        return [];
    }
}

// Main route to render the tag explorer page
router.get("/", async (req, res) => {
    try {
        // Query to get all files with their tags
        const sqlFiles = `
            SELECT 
                f.file_id, 
                f.file_path, 
                GROUP_CONCAT(DISTINCT tv.value_id) AS tag_values, 
                GROUP_CONCAT(DISTINCT t.tag_id) AS tag_names 
            FROM files f 
            LEFT JOIN file_tags ft ON f.file_id = ft.file_id 
            LEFT JOIN tag_values tv ON ft.value_id = tv.value_id 
            LEFT JOIN tags t ON tv.tag_id = t.tag_id 
            GROUP BY f.file_id, f.file_path 
            ORDER BY f.file_path ASC
        `;

        // Get file results from database
        const fileResults = await new Promise((resolve, reject) => {
            db.query(sqlFiles, (err, results) => {
                if (err) reject(err);
                else resolve(results || []);
            });
        });

        // Process files and get metadata
        const filesWithMetadata = fileResults.map(file => {
            const filePath = path.join(filesDirectory, file.file_path.split('/').pop());
            const fileStats = safeGetFileStats(filePath);

            return {
                ...file,
                metadata: {
                    size: fileStats.size,
                    modifiedDate: fileStats.modifiedDate,
                    fileType: fileStats.fileType,
                    error: fileStats.error
                }
            };
        });

        // Fetch all required data in parallel
        const [tags, tagValues, defaultTags] = await Promise.allSettled([
            makeAPIRequest('http://localhost:3000/tags'),
            makeAPIRequest('http://localhost:3000/tag_values'),
            makeAPIRequest('http://localhost:3000/default-tags')
        ]);

        // Process results
        const processedTags = tags.status === 'fulfilled' ? tags.value : [];
        const processedTagValues = tagValues.status === 'fulfilled' ? tagValues.value : [];
        const processedDefaultTags = defaultTags.status === 'fulfilled' ? defaultTags.value : [];

        // Log data for debugging
        console.log('Tags:', processedTags);
        console.log('Tag values:', processedTagValues);
        console.log('Default tags:', processedDefaultTags);

        res.render('tag-explorer', {
            files: filesWithMetadata,
            tags: processedTags,
            tagValues: processedTagValues,
            defaultTags: processedDefaultTags,
            helpers: {
                formatSize: (size) => {
                    if (!size) return 'N/A';
                    return size < 1024 ? `${size} bytes` : `${(size / 1024).toFixed(2)} KB`;
                },
                formatDate: (date) => {
                    if (!date) return 'N/A';
                    return new Date(date).toLocaleDateString();
                },
                getFileType: (filePath) => getFileType(filePath)
            }
        });

    } catch (error) {
        console.error('Error in tag explorer route:', error);
        res.status(500).render('error', {
            message: 'Server error: ' + error.message,
            error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
        });
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