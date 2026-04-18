import os
import re

def fix_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # 1. Fix hardcoded dark backgrounds on inputs/cards/placeholders
    new_content = content.replace('bg-black/40', 'bg-muted/50')
    new_content = new_content.replace('bg-black/30', 'bg-muted/50')
    new_content = new_content.replace('bg-black/20', 'bg-muted/20')
    
    # 2. Fix placeholders that are too dark
    new_content = new_content.replace('placeholder-gray-600', 'placeholder-muted-foreground/50')
    new_content = new_content.replace('placeholder-gray-500', 'placeholder-muted-foreground/50')
    new_content = new_content.replace('text-gray-500', 'text-muted-foreground')
    new_content = new_content.replace('text-gray-600', 'text-muted-foreground')

    # 3. Fix status badge colors for light mode contrast
    replaces = [
        ('text-orange-300', 'text-orange-600 dark:text-orange-400'),
        ('text-emerald-300', 'text-emerald-600 dark:text-emerald-400'),
        ('text-yellow-300', 'text-yellow-600 dark:text-yellow-400'),
        ('text-purple-300', 'text-purple-600 dark:text-purple-400'),
        ('text-cyan-300', 'text-cyan-600 dark:text-cyan-400'),
        ('text-pink-300', 'text-pink-600 dark:text-pink-400'),
        ('text-purple-200', 'text-primary'), # already handled but good for safety
    ]
    for old, new in replaces:
        new_content = new_content.replace(old, new)

    # 4. Fix gradient buttons to have WHITE text always
    # Look for bg-gradient-to... and text-foreground or text-muted-foreground or text-purple-200
    # Actually, the user specifically mentioned "white not black".
    # I'll look for text-foreground on gradient buttons.
    new_content = re.sub(r'(bg-gradient-to-[^ ]+[^>]*?)(text-foreground|text-muted-foreground)', r'\1text-white', new_content)

    if content != new_content:
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Fixed {file_path}")

def main():
    base_path = '/Users/admin/Documents/LMS/client/src/pages'
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.jsx'):
                fix_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
