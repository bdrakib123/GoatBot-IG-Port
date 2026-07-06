import sys

file_path = 'README.md'
with open(file_path, 'r') as f:
    content = f.read()

technical_details = '''
### ⚙️ Technical Environment
- **Node.js:** Requires version **18 or higher**.
- **Protocol:** Uses the **Instagram MQTT (ICA)** protocol for real-time messaging.
- **Engine:** Powered by the GoatBot V2 architecture ported to Instagram.
- **Library:** Deep integration with `@neoaz07/nkxica` for core API interactions.

### ❓ Troubleshooting TTS (say command)
If the `say` command fails:
1. Ensure your bot server has internet access to Google's translation services.
2. Check if the `temp` or system temporary directory is writable.
3. If using on Render/Replit, ensures dependencies are correctly installed.
'''

if '## ⚙️ Configuration' in content:
    content = content.replace('## ⚙️ Configuration', technical_details + '## ⚙️ Configuration')
    with open(file_path, 'w') as f:
        f.write(content)
    print("Successfully updated README.md with technical details")
else:
    print("Configuration section not found")
