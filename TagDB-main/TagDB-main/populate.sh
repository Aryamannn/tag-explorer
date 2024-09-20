#!/usr/bin/env bash
# Create (empty) test files, add them to TagDB, then create a set of tags
# and tag the files we just added
# NOTE: TagDB must already be running:
#   cd [...]/TagDB
#   node tagdb.js

post_tag() {
    curl -s -X POST http://localhost:3000/tags \
        -H "Content-Type: application/json" \
        -d "{\"tag_name\": \"$1\", \"tag_value\": \"$2\"}" | jq
}

post_file() {
    # Resolve the full path from the provided parameter
    local file_path=$(realpath "$1")

    # Execute the curl command with the full file path
    curl -s -X POST http://localhost:3000/files \
        -H "Content-Type: application/json" \
        -d "{\"file_path\": \"$file_path\"}" | jq
}

add_file_tag() {
    # Resolve the full path from the provided parameter
    local file_path=$(realpath "$1")

    # Execute the curl command with the full file path, tag name, and tag value
    curl -s -X POST http://localhost:3000/files/by-name/tags/add \
        -H "Content-Type: application/json" \
        -d "{ \"file_path\": \"$file_path\", \"tag_name\": \"$2\", \"tag_value\": \"$3\" }" | jq
}

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

# List of files
TEST_DIR=test_dir
data_file="test_data.txt"
filenames=()
triples=()
tags=()

# Function to create the tags array from the triples and remove filenames
tags_from_triples() {
  for triple in "${triples[@]}"; do
  	if [[ "$triple" =~ \"[^\"]+\"[[:space:]]+\"([^\"]+)\"[[:space:]]+\"([^\"]+)\" ]]; then
      tv_pair="\"${BASH_REMATCH[1]}\" \"${BASH_REMATCH[2]}\""
      tags+=("$tv_pair")
    fi
  done
  # Sort and remove duplicates
  readarray -t tags < <(printf "%s\n" "${tags[@]}" | sort -u)
}

# Function to parse the data and populate arrays
parse_data() {
  current_filename=""
  while IFS= read -r line; do
    # Ignore comments which begin with '#'
    if [[ ! "$line" =~ ^[[:space:]]*# ]]; then
      # If the line starts with any whitespace, it's a tag-value pair
      if [[ "$line" =~ ^[[:space:]] ]]; then
        # Extract the tag and value, handling quotes
        if [[ "$line" =~ \"([^\"]+)\"[[:space:]]+\"([^\"]+)\" ]]; then
          tag="${BASH_REMATCH[1]}"
          value="${BASH_REMATCH[2]}"
        fi
        triples+=("\"$current_filename\" \"$tag\" \"$value\"")
      else
        # Reset IFS to default for handling filenames correctly
        IFS=' '
        # If the line doesn't start with whitespace, it's a filename
        current_filename="$line"
        # Store the filename in the array
        filenames+=("$current_filename")
      fi
    fi
  done < "$data_file"
  tags_from_triples
}

populate_files() {
	echo "About to create test files in a sub-directory named $TEST_DIR"
	read -p "Do you want to proceed? (y/n): " confirm

	if [[ $confirm == "y" ]]; then
		# Ensure the test directory exists
		mkdir $TEST_DIR

		# Loop through the files list and create an file for each
		for test_file in "${filenames[@]}"; do
		    touch "$TEST_DIR/$test_file"
		    post_file "$TEST_DIR/$test_file"
		done
	fi
}

populate_tags() {
	for tv_pair in "${tags[@]}"; do
  		eval post_tag $tv_pair
	done

	# List all tags and for each, list its values
	curl -X GET http://localhost:3000/tags/with-values | jq
}

tag_files() {
  for triple in "${triples[@]}"; do
    # Use eval and awk to extract the first, second, and third elements
    fname=$(echo "$triple" | awk -F'"' '{print $2}')
    tag_name=$(echo "$triple" | awk -F'"' '{print $4}')
    tag_value=$(echo "$triple" | awk -F'"' '{print $6}')

    # Call the add_file_tag function with the extracted elements
    add_file_tag "$TEST_DIR/$fname" "$tag_name" "$tag_value"
  done

}

# Read the files and tag test data
parse_data
  # for f in "${filenames[@]}"; do
  #     echo $f
  # done

  # for tv_pair in "${tags[@]}"; do
  #     echo $tv_pair
  # done

  # for triple in "${triples[@]}"; do
  #     echo $triple
  # done

# Create the test files and add references to them in TagDB
populate_files

# Create Tags
populate_tags

# Now lets tag the files
tag_files

# Do some queries
query "Genre" "Romance" "Genre" "Comedy"
query "Genre" "Drama" "Actor" "Tom Hanks"
query "Genre" "Drama" "Genre" "Comedy" "Actor" "Tom Hanks"

query "Client" "Walmart" "Priority" "High"
query "Client" "Walmart" "Priority" "Low"
query "Priority" "High"
query "Priority" "High" "Content Type" "Presentation"
