# Github Migration Script

## Set Up

Clone this repo, then

```sh
 $ cd <cloned directory>
 $ npm install
```

* Create a personal access token https://github.com/settings/tokens. Make sure to give yourself appropriate permissions.
* Copy .env.sample to a new file, .env, in the root dir. 
* Fill out the appropriate values. 
* Guide for values:

|  name   |  description |
| ----- | ------- | 
| org_name | Either your github username, or the github organization name that you want to clone into. |
| github_url | `https://github.com` or your github enterprise url.
| token | the personal access token you created earlier.

* No trailing slashes on urls.
* Fill out the links.json file. Each repo you want to clone from goes in there. _**You must use the clone urls, with .git at the end**_. Works with https, haven't tested with ssh.

--- 
## Usage
#### TO DELETE EVERY REPO IN THE SPECIFIED ORGANIZATION/USER
`node migrate.js delete`

Note: you must have given yourself delete permissions in your personal access token.

#### Clone from links.json to the specified organization/user
`node repo.js clone`

If you are prompted for your github username and password, enter them. You should only have to do this once, since they will be cached.
