This is the project I developed during my internship at Vihobook. I made a
frontend for the user and product management RESTful API I developed during my
first internship.

# How to setup and run the project

(I am not sure about how to setup and run the project on Windows but the steps
below should work on Mac OS and Linux)

First backend I've developed during my previous internship must be setup and
start running. I've made some changes like bug fixes after previous internship
was completed, in order to use it properly in this project.

```bash
git clone -b fixes_and_edits --single-branch git@github.com:srumut/internship_mava.git
cd internship_mava/user_and_product_management
npm i
npx prisma generate
npx prisma migrate reset
npm run start
```

Note: the command `npx prisma migrate reset` will want you to confirm the operation, simply press **Y** key

Then we need to setup this project on another shell instance while backend is running

```bash
git clone git@github.com:srumut/internship_vihobook.git
cd internship_vihobook
npm i
npm run dev
```

After that frontend must be available on [localhost:3000](localhost:3000).

There should be only an admin with username **admin** and password **admin123**
