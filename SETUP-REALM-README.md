# Setting up a Realm Cloud Instance

Getting started with realm is quite easy.

- Head to https://cloud.realm.io/login
- Create an account
- Every user is provided a free instance on Realm cloud. Hit the `Create New Instance` button.

![RealmPostLogin](https://raw.githubusercontent.com/hasura/realm-pg-sync/master/readme-assets/realm-post-login.png)

- Provide a unique name to your instance

![RealmInstanceName](https://raw.githubusercontent.com/hasura/realm-pg-sync/master/readme-assets/realm-instance-name.png)

- You will now be redirected to the dashboard. In this case `https://licensed-fresh-chair.us1.cloud.realm.io` is the url to my realm cloud instance. Click on the `Open in Studio` button to open the instance on Realm Studio (You can download Realm Studio from [here](https://licensed-fresh-chair.us1.cloud.realm.io))

![OpenInStudio](https://raw.githubusercontent.com/hasura/realm-pg-sync/master/readme-assets/realm-open-in-studio.png)


## Creating an admin user on your realm server

- Open up your realm server on Realm Studio (instructions above)
- Click on the `Users` tab and then the `Create New User` button on bottom right corner.

![UserTab](https://raw.githubusercontent.com/hasura/realm-pg-sync/master/readme-assets/realm-studio-users.png)

- Choose a username and password for your user

![CreateUser](https://raw.githubusercontent.com/hasura/realm-pg-sync/master/readme-assets/realm-studio-create-user.png)

- You can now change the role of this user to `Administrator`

![AdministratorRole](https://raw.githubusercontent.com/hasura/realm-pg-sync/master/readme-assets/realm-studio-user-permission.png)
