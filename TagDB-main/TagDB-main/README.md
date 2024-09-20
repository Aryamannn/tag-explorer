# TagDB

This is the Tag Database component of the TagExplorer project. It is a Node/Express service incorporating MySQL as the underlying database. It exports a REST API for use by the TagExplorer frontend.

The actual TagDB service is completely implemented within `tagdb.js`. The other files of interest are:

* Implementation
	* **tagdb.js**: The core implementation
* Node-related:
	* **package-lock.json**
	* **package.json**
* Setup and maintenance:
	* **populate.sh**: Used to create test files and populate TagDB with sample tags. It also applies those tags to the test files.
	* **resetDB.sql**: A SQL script which emoties out an exisitng TagDB database
	* **tagdb.sql**: A SQL script which creates the `taguser` and schema within MySQL.
* Testing:
	* **test_apis.sh**: A collection of curl commands that exercise the REST API
	* **test_data.txt**: Data used by the `populate.sh` script to create files, tags, and taggings.
