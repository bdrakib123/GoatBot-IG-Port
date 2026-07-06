import sys

file_path = 'bot/InstagramBot.js'
with open(file_path, 'r') as f:
    content = f.read()

search_text = "const ext = item.filename ? path.extname(item.filename) : (item.name ? path.extname(item.name) : '');"
replace_text = "const ext = item.filename ? path.extname(item.filename) : (item.name ? path.extname(item.name) : (item.path ? path.extname(item.path) : ''));"

if search_text in content:
    new_content = content.replace(search_text, replace_text)
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully patched bot/InstagramBot.js")
else:
    print("Search text not found")
