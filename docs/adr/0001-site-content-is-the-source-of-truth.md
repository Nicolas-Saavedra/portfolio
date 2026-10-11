# Site content is the source of truth for career data

Nicolas's career data used to live in three copies that drifted apart (LinkedIn, a hand-made PDF, the old site), and the old site rotted because changing its content meant editing code. The site's content files are now the only canonical copy: the CV is generated from them at build time and never edited by hand, and LinkedIn is updated by hand from the site, not the other way around. The cost is a CV build step. The gain is that updating the site and updating the CV become one edit, which also makes turning on Open to Work free.
