#!/usr/bin/env bash

# cd [...]/TagDB
# Start the TagDB service in a separate shell, or in the background with:
# node tagdb.js

query() {
    # Start building the JSON data with an opening structure
    local json_data='{ "tagValuePairs": ['
    local tvpairs=""

    # Iterate over the list of key-value pairs passed as arguments
    while [[ $# -gt 1 ]]; do
        local tag_name=$1
        local tag_value=$2

        # Append the key-value pair to the JSON structure
        json_data+="{ \"tag_name\": \"$tag_name\", \"tag_value\": \"$tag_value\" },"
        tvpairs="$tvpairs, ($tag_name, $tag_value)"
        # Shift arguments to get the next key-value pair
        shift 2
    done

    # Remove the trailing comma from the last key-value pair
    json_data=${json_data%,}
    # Remove the initial comma
    tvpairs="(${tvpairs#*[(]}"

    # Close the JSON array and object
    json_data+="] }"

    # Execute the curl command
    echo "===== Query on: " $tvpairs "====="
    curl -s -X POST http://localhost:3000/files/tags \
        -H "Content-Type: application/json" \
        -d "$json_data" | jq -r '.[].file_path | split("/") | last'
}

# Create a tag
curl -X POST http://localhost:3000/tags -H "Content-Type: application/json" -d '{"tag_name": "Region", "tag_value": "USA"}' | jq
curl -X POST http://localhost:3000/tags -H "Content-Type: application/json" -d '{"tag_name": "City", "tag_value": "New York"}' | jq
curl -X POST http://localhost:3000/tags -H "Content-Type: application/json" -d '{"tag_name": "Color", "tag_value": "Red"}' | jq
curl -X POST http://localhost:3000/tags -H "Content-Type: application/json" -d '{"tag_name": "ToBeDeleted", "tag_value": "N/A"}' | jq

# Create a raw tag with no associated value
curl -X POST http://localhost:3000/tags/create -H "Content-Type: application/json" -d '{"tag_name": "example"}' | jq

# Delete a tag based on it's name
curl -X DELETE http://localhost:3000/tags/delete/example | jq

# Delete a tag based on its id
curl -X DELETE http://localhost:3000/tags/4 | jq

# List tags
curl http://localhost:3000/tags | jq

# List Tag values
curl http://localhost:3000/tag_values | jq

# Rename a tag
curl -X PUT http://localhost:3000/tags/1 -H "Content-Type: application/json" -d '{"tag_name": "Country"}' | jq

# Add a file reference
curl -X POST http://localhost:3000/files -H "Content-Type: application/json" -d '{"file_path": "/path/to/file1.txt"}' | jq
curl -X POST http://localhost:3000/files -H "Content-Type: application/json" -d '{"file_path": "/path/to/file2.txt"}' | jq
curl -X POST http://localhost:3000/files -H "Content-Type: application/json" -d '{"file_path": "/path/to/file3.txt"}' | jq
curl -X POST http://localhost:3000/files -H "Content-Type: application/json" -d '{"file_path": "/path/to/file4.txt"}' | jq
curl -X POST http://localhost:3000/files -H "Content-Type: application/json" -d '{"file_path": "/path/to/file5.txt"}' | jq
curl -X POST http://localhost:3000/files -H "Content-Type: application/json" -d '{"file_path": "/path/to/file6.txt"}' | jq
curl -X POST http://localhost:3000/files -H "Content-Type: application/json" -d '{"file_path": "/path/to/file7.txt"}' | jq
curl -X POST http://localhost:3000/files -H "Content-Type: application/json" -d '{"file_path": "/path/to/file8.txt"}' | jq

# Add a Tag to a File Based on tag_name and tag_value
curl -X POST http://localhost:3000/files/1/tags/add -H "Content-Type: application/json" -d '{"tag_name": "Country", "tag_value": "USA"}' | jq
curl -X POST http://localhost:3000/files/2/tags/add -H "Content-Type: application/json" -d '{"tag_name": "City", "tag_value": "New York"}' | jq

# Add a tag based on the file name, not its id
curl -X POST http://localhost:3000/files/by-name/tags/add \
     -H "Content-Type: application/json" \
     -d '{
           "file_path": "/path/to/file1.txt",
           "tag_name": "Color",
           "tag_value": "Red"
         }' | jq

# Remove a tag from a file
curl -X DELETE http://localhost:3000/files/1/tags/1  | jq

# Retrieve Files with Given Tag Values
curl "http://localhost:3000/files?tag_name=Country&tag_value=USA" | jq
curl "http://localhost:3000/files?tag_name=City&tag_value=New%20York" | jq


# List tags for a specific file
curl http://localhost:3000/files/1/tags | jq
curl http://localhost:3000/files/2/tags | jq

# List all values for a specific tag
curl -X GET http://localhost:3000/tags/Country/values | jq

# List all tags and for each, list its values
curl -X GET http://localhost:3000/tags/with-values | jq

# Queries
query "Genre" "Comedy"   "Actor" "Tom Hanks"
query "Genre" "*"        "Actor" "Tom Hanks"
query "Genre" "Comedy"   "Actor" "Brad Pitt" "Actor" "Angelina Jolie"
query "Genre" "*"        "Actor" "Brad Pitt" "Actor" "Angelina Jolie"
query "Content Type" "Presentation"
query "Content Type" "Presentation" "Client" "*"
query                               "Client" "*"
