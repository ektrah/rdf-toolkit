import json
import re

# Function to parse schema.txt
def parse_schema(file_path):
    with open(file_path, 'r') as file:
        content = file.read()

    class_pattern = re.compile(r'class (\S+) extends (\S+)(?: \{(.*?)\})? \.')
    property_pattern = re.compile(r'\*(\S+) (\S+);')

    classes = {}
    for match in class_pattern.finditer(content):
        class_name = match.group(1)
        parent_class = match.group(2)
        properties_block = match.group(3)

        properties = []
        if properties_block:
            for prop_match in property_pattern.finditer(properties_block):
                properties.append({
                    'property': prop_match.group(1),
                    'range': prop_match.group(2)
                })

        classes[class_name] = {
            'parent': parent_class,
            'properties': properties
        }

    return classes

# Function to build tree.json
def build_tree(classes):
    tree = {}
    for class_name, class_info in classes.items():
        parent_class = class_info['parent']
        if parent_class not in tree:
            tree[parent_class] = []
        tree[parent_class].append({
            'id': class_name,
            'label': class_name,
            'children': []
        })

    def add_children(node):
        if node['id'] in tree:
            node['children'] = tree[node['id']]
            for child in node['children']:
                add_children(child)

    # Find root classes (classes without parents)
    root_classes = [node for node in tree if node not in classes]
    root_tree = []
    for root in root_classes:
        root_node = {'id': root, 'label': root, 'children': tree[root]}
        add_children(root_node)
        root_tree.append(root_node)

    return root_tree

# Function to build search.json
def build_search(classes):
    search = []
    for class_name, class_info in classes.items():
        search.append({
            'id': class_name,
            'name': class_name,
            'description': '',  # Add descriptions if available
            'type': 'Class'
        })
    return search

# Main function to generate tree.json and search.json
def generate_json_files(schema_file):
    classes = parse_schema(schema_file)
    
    tree = build_tree(classes)
    with open('tree.json', 'w') as tree_file:
        json.dump(tree, tree_file, indent=2)

    search = build_search(classes)
    with open('search.json', 'w') as search_file:
        json.dump(search, search_file, indent=2)

    print("JSON files generated successfully.")

generate_json_files('schema.txt')
