import os
import re

directory = './src'

replacements = [
    (re.compile(r'glass-panel'), 'bg-card text-card-foreground border rounded-xl shadow-sm'),
    (re.compile(r'text-gray-200'), 'text-foreground'),
    (re.compile(r'text-gray-300'), 'text-muted-foreground'),
    (re.compile(r'text-gray-400'), 'text-muted-foreground'),
    (re.compile(r'text-red-200'), 'text-destructive'),
    (re.compile(r'text-pink-300'), 'text-primary'),
    (re.compile(r'text-purple-300/70'), 'text-muted-foreground'),
    (re.compile(r'text-purple-200/70'), 'text-muted-foreground'),
    (re.compile(r'text-purple-200/60'), 'text-muted-foreground'),
    (re.compile(r'text-purple-300'), 'text-primary'),
    (re.compile(r'text-cyan-300'), 'text-accent'),
    (re.compile(r'border-white/10'), 'border-border'),
    (re.compile(r'border-white/20'), 'border-border'),
    (re.compile(r'border-white/5'), 'border-border'),
    (re.compile(r'bg-white/5'), 'bg-muted'),
    (re.compile(r'bg-white/10'), 'bg-muted/80'),
    (re.compile(r'from-white to-gray-400'), 'from-foreground to-muted-foreground'),
    (re.compile(r'from-white to-gray-300'), 'from-foreground to-muted-foreground'),
    (re.compile(r'bg-\[\#0a0c16\]'), 'bg-popover text-popover-foreground')
]

text_white_regex = re.compile(r'(?<![a-zA-Z0-9-])text-white(?![a-zA-Z0-9-])')

def process_directory(dir_path):
    for root, dirs, files in os.walk(dir_path):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                full_path = os.path.join(root, file)
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Exclude replacing text-white where it might break things, but mostly it's fine.
                content = text_white_regex.sub('text-foreground font-semibold', content)
                
                for regex, replacement in replacements:
                    content = regex.sub(replacement, content)
                
                if content != original_content:
                    with open(full_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated {full_path}")

process_directory(directory)
print("Migration complete!")
