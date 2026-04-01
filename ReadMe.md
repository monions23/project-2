# DAT.IA

## Project Description

Our project, DAT.IA, is a data analytics dashboard intended for the state of Iowa. The Iowa government has a large amount of data stored on their website [data.iowa.gov](data.iowa.gov), where individual datasets can be viewed. Users can scan and download raw data or, in some cases, look at charts that accompany said dataset. However, it is difficult to examine datasets in comparison with each other. Additionally, due to the spatial nature of the data collected, it would perhaps be better to view it in the form of a geographic visualization rather than a standard bar or line chart. As of right now, [data.iowa.gov](data.iowa.gov) does not appear to provide that capability. Our goal was to create an application that provided a way for a user to interact with and view a variety of datasets easily and effectively.

<img width="2382" height="1144" alt="image" src="https://github.com/user-attachments/assets/ec14f473-f2ff-4218-b4a9-b1670b6cb728" />

The first half of our page consists of a map of the state of Iowa with drop-downs to select counties and datasets. Users can manipulate the drop-downs to select and deselect both any Iowa counties or any chosen dataset. Active counties without any data selected are filled with an golden-orange color.

<img width="3024" height="1452" alt="image" src="https://github.com/user-attachments/assets/dbd72356-9ca9-4356-abf5-6c243f756093" />

Users can also manipulate the map to select and deselect counties. They can click on counties in the map to deselect them or, if a county has already been deselected, they can click it to reactivate it. In relation to this, users can click and drag to either select or deselect a wide array of counties. Any change that is completed in the map is reflected in the corresponding county dropdown for consistency.

https://github.com/user-attachments/assets/0294afc5-89f1-42e3-b047-753ad2e5b152

Finally, as one last county selection feature, users can search for counties by typing in county names.

https://github.com/user-attachments/assets/440de4a4-8df4-4bfb-a4fc-c425ccdef127

Note that when a user chooses a dataset, only the counties that are selected render data. Users can choose specific attributes of each dataset to display. The resulting data is visualized in either univariate maps (if one dataset's attribute is selected at once) or bivariate maps (if two datasets' attributes are selected at once).

https://github.com/user-attachments/assets/c936344f-2467-4f1e-958b-e793f1fd0883

Below the map section are visualizations that reflect the selected counties and dataset chosen. These charts update automatically when the selected information (counties and/or datasets) are changed by the user.

<img width="1496" height="827" alt="Screenshot 2026-03-31 at 7 06 25 PM" src="https://github.com/user-attachments/assets/e9538964-c796-4a2c-ada2-ce48b83f56cb" />

## Installation Steps

1) Create a new folder in you computer and open that folder in VSCode. Then, in the terminal, type the following commands:

   ```
     git clone https://github.com/monions23/project-2.git

     cd project-2
   ```
     This will clone the repository, and then it will move to the correct directory so you can pull/push changes.
## Usage Instructions

**To Run Locally:**
Start a local server through your terminal; for example, you can use the command below:
```
python3 -m http.server 8000
```
Then, open the https link that it gives you (http://localhost:3000).

**To Push Changes**

If you have changes you would like to push, great! We would love to review them. **However, ensure you do not push to the main branch.** Doing so can cause merge conflicts in the code and errors in the application itself.

To push modified changes, type the following commands into your terminal:

```
git checkout -b your-new-branch-name
git add .
git commit -m "Your commit message, with a brief description of your changes"
git push -u origin your-new-branch-name
```
`git checkout -b your-new-branch-name` checks out a new branch for you to push to. Note - ensure to give your branch a relevant name that corresponds with the changes you wish to make).

`git add .` adds all of your local files/changes to your local working tree. It is necessary to Git knows what to commit and push.

Then, `git commit -m "Your commit message"` creates a commit, and `git push -u origin your-new-branch-name` pushes your changes to the new branch.

Once you have done this, go to Git and create a merge request, tagging one or multiple of our team members in the process. We will review your code and merge it safely.

## Credits

[@monions23](https://github.com/monions23)
[@AayushmaAryal](https://github.com/AayushmaAryal)
[@willfisher3838](https://github.com/willfisher3838)

## Project Roadmap

Below are some proposed features and advancements:

- [ ] Add more datasets
- [ ] Bug fixes for map selection
- [ ] Extra styling for map and dropdown
- [ ] Making charts below map customizable - e.g., so user can choose the visualization they want to see
