import json

DATA = "birds.json"

with open(DATA, "r", encoding="utf-8") as f:
    data = json.load(f)

missing = []
url_only = []

for order in data["birds"].values():
    for family in order.values():
        for genus, genus_obj in family.items():
            if genus in ("name", "queries"):
                continue

            for epithet, species_obj in genus_obj.items():
                if "recordings" not in species_obj:
                    missing.append(f"{genus} {epithet}")
                else:
                    recordings = species_obj["recordings"]
                    if isinstance(recordings[0], str):
                        url_only.append(f"{genus} {epithet}")


print(f"{len(url_only)} species with recordings missing credit")

for species in url_only:
    print(f"- {species}")

print(f"{len(missing)} species missing recordings")

for species in missing:
    print(f"- {species}")
