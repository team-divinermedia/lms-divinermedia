import os
import re

directory = './src/pages'

def process_file(full_path):
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all classNames
    def repl(m):
        cls_str = m.group(1)
        # If the class string contains a button-like or badge-like vibrant background
        if re.search(r'bg-gradient|bg-(purple|cyan|emerald|blue|orange|pink|red|green|indigo|teal)-[56]00', cls_str):
            cls_str = cls_str.replace('text-foreground font-semibold', 'text-white font-bold')
            cls_str = cls_str.replace('text-foreground', 'text-white')
        return 'className="' + cls_str + '"'

    new_content = re.sub(r'className="([^"]+)"', repl, content)

    if new_content != content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {full_path}")

for root, dirs, files in os.walk(directory):
    for str_file in files:
        if str_file.endswith('.jsx') or str_file.endswith('.js'):
            process_file(os.path.join(root, str_file))
