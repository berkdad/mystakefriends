import os

def generate_tree(path, exclude_dirs=None, indent=""):
    exclude_dirs = exclude_dirs or []
    with open("structure.txt", "w") as output_file:
        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            level = root.replace(path, "").count(os.sep)
            indent = " " * 4 * level
            output_file.write(f"{indent}{os.path.basename(root)}/\n")
            sub_indent = " " * 4 * (level + 1)
            for f in files:
                output_file.write(f"{sub_indent}{f}\n")

generate_tree(r"C:\firebaseProjects\mystakefriends\src", exclude_dirs=["node_modules", ".git", ".next"])
