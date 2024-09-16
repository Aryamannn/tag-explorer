import requests
import random

BASE_URL = "http://localhost:3000"

# Function to create a tag
def create_tag(tag_name):
    response = requests.post(f"{BASE_URL}/tags/create", json={"tag_name": tag_name})
    response.raise_for_status()
    return response.json()['tag_id']

# Function to create a tag value
def create_tag_value(tag_id, tag_value):
    response = requests.post(f"{BASE_URL}/tags", json={"tag_name": tag_name, "tag_value": tag_value})
    response.raise_for_status()
    return response.json()['value_id']

# Function to create a file reference
def create_file(file_path):
    response = requests.post(f"{BASE_URL}/files", json={"file_path": file_path})
    response.raise_for_status()
    return response.json()['file_id']

# Function to add a tag to a file
def add_tag_to_file(file_id, tag_name, tag_value):
    response = requests.post(f"{BASE_URL}/files/{file_id}/tags/add", json={"tag_name": tag_name, "tag_value": tag_value})
    response.raise_for_status()

# Create 10 tags
tags = ["Category", "Status", "Priority", "Department", "Location", "Project", "Type", "Client", "Phase", "Team"]
tag_ids = {tag: create_tag(tag) for tag in tags}

# Create 3-5 values for each tag
tag_values = {
    "Category": ["Document", "Image", "Video", "Audio", "Spreadsheet"],
    "Status": ["New", "In Progress", "Completed", "Archived"],
    "Priority": ["Low", "Medium", "High", "Critical"],
    "Department": ["HR", "Finance", "IT", "Marketing", "Sales"],
    "Location": ["New York", "London", "Tokyo", "Sydney", "Berlin"],
    "Project": ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"],
    "Type": ["Internal", "External", "Client", "Vendor", "Partner"],
    "Client": ["Client A", "Client B", "Client C", "Client D", "Client E"],
    "Phase": ["Initiation", "Planning", "Execution", "Monitoring", "Closure"],
    "Team": ["Team A", "Team B", "Team C", "Team D", "Team E"]
}

# Store tag value ids
tag_value_ids = {}

for tag_name, values in tag_values.items():
    tag_value_ids[tag_name] = []
    for tag_value in values:
        value_id = create_tag_value(tag_ids[tag_name], tag_value)
        tag_value_ids[tag_name].append(tag_value)

# Create 10 file references
file_paths = [f"/path/to/file{i}.txt" for i in range(1, 11)]
file_ids = [create_file(file_path) for file_path in file_paths]

# Apply 3-5 tags to each file reference
for file_id in file_ids:
    assigned_tags = random.sample(tags, k=random.randint(3, 5))
    for tag_name in assigned_tags:
        tag_value = random.choice(tag_value_ids[tag_name])
        add_tag_to_file(file_id, tag_name, tag_value)

print("Database populated successfully.")