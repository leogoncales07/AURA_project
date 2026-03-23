import os
import re

root_dir = r"c:\Users\Utilizador\.gemini\antigravity\scratch\meu_app_agentes\frontend\src"

# Regex for lucide imports with capturing group for icon name
# Supports both:
# import IconName from 'lucide-react/icons/icon-name';
# import IconName from "lucide-react/icons/icon-name";
# import { IconName } from 'lucide-react/icons/icon-name';
# etc.

def camel_case(s):
    # This is a bit tricky because some icons are BarChart2 etc.
    # But usually the user provided name is already correct in the file.
    return s

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find all lucide imports
            matches = re.finditer(r"import\s+(?:\{?\s*)(\w+)(?:\s*\}?)\s+from\s+['\"]lucide-react/(?:icons/|dist/esm/icons/)[^'\"]+['\"];?", content)
            
            icon_imports = []
            new_content = content
            
            # Group consecutive lucide imports
            found_any = False
            for match in matches:
                found_any = True
                full_stmt = match.group(0)
                icon_name = match.group(1)
                icon_imports.append(icon_name)
                # Remove the original statement
                new_content = new_content.replace(full_stmt, "")

            if found_any:
                # Add the new optimized import at the top (after use client if present)
                optimized_stmt = f"import {{ {', '.join(sorted(list(set(icon_imports))))} }} from 'lucide-react';"
                
                if "'use client'" in new_content or '"use client"' in new_content:
                    new_content = new_content.replace("'use client';", f"'use client';\n{optimized_stmt}")
                    new_content = new_content.replace('"use client";', f'"use client";\n{optimized_stmt}')
                else:
                    new_content = optimized_stmt + "\n" + new_content

                # Clean up multiple newlines
                new_content = re.sub(r'\n{3,}', '\n\n', new_content)

                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {path}")
