const exec = require('child_process').execSync
const dotenv = require('dotenv')
const execThunk = command => _ => exec(command)
const axios = require('axios')
const links = require('./links.json')
const arg = process.argv[2];
const fs = require('fs');

class MigrateRepo {
  constructor() {

    dotenv.config();

    this.token = process.env.token
    this.orgName = process.env.org_name
    this.githubURL = process.env.github_url

    this.links = links;
    this.getURL = `${this.githubURL}/api/v3/orgs/${this.orgName}/repos`;

    this.determineAction(arg);

  }

  checkIfExists(links) {
    // gets a list of all repos in the org
    // console.log(links);
    axios.get(this.getURL, {
      params: {
        access_token: this.token
      }
    })
    .then(res => {
      // store response for posterity
      fs.writeFileSync('res.json', JSON.stringify(res.data), 'utf8');

      // get github urls for each repo in the org from response object
      const urlList = res.data.map(singleRepo => singleRepo.html_url)
      console.log('got list of repos from github');

      // check to see if github repo name exists in our links.json file
      this.links.forEach(link => {
        const repoTitle = this.splitName(link);
        if(urlList.some(url => this.splitName(url) === repoTitle)) {
          // if repo size > 0, skip
          // means that it's in github and is not empty.
          if(this.checkSize(repoTitle, res.data)) {
            console.log(`${repoTitle} repo exists in github, skipping`)
            return;
          }
          else {
            console.log(`${repoTitle} repo exists but is empty, cloning and adding remote`)
            const newRepoURL = this.matchOldRepoToNew(link, urlList)
            this.cloneRepo(link);
            this.addRemote(link, newRepoURL);
          }
        }
        else {
          // else create the repo which also does addRemote
          console.log(`${repoTitle} doesnt exist in github`);
          this.cloneRepo(link);
          this.createRepo(repoTitle);
        }
      })
    })
    .catch(err => {
      console.error(err)
      console.log(this.getURL)
    })
  }

  determineAction(arg) {
    this.cacheCredentials();
    
    switch(arg) {
      case 'clone':
        this.checkIfExists(this.links);
      break;
      case 'delete': 
      this.deleteEverything();
      break;
      default:
        return console.error('please specify "clone" or "delete" as an argument')
    }
  }

  deleteEverything() {
    axios.get(this.getURL)
    .then(res => {
      res.data.forEach(url => {
        let deleteURL = `${this.githubURL}/api/v3/repos/${this.orgName}/${this.splitName(url.html_url)}?access_token=${this.token}`
        axios.delete(deleteURL)
        .then(success => {
          console.log(`deleted ${url}`)
        })
        .catch(err => {
          console.error(err.response);
        })
      })  
    })
  }

  createRepo(repo) {
    const postURL = `${this.githubURL}/api/v3/orgs/${this.orgName}/repos?access_token=${this.token}`
    axios
    .post(postURL, {"name": repo})
    .then(res => {
      console.log(`${res.data.url} created`)
      const repoName = this.splitName(res.data.url);
      this.addRemote(repo, repoName);
    })
    .catch(error => console.error(error.response.data))
  }

  checkSize(repoName, githubList) {
    let exists = false;
    
    // find index of reponame in links.json
    githubList.forEach(g => {
      if(g.name === repoName) {
        if(g.size > 0) {
          exists = true;
        }
      }
    })

    return exists;
  }

  remote(repo) { return `${this.githubURL}/${this.orgName}/${repo}.git` }

  cloneRepo(oldRepo) {
    console.log(`cloning ${oldRepo}`);
    let repoName = this.splitName(oldRepo)
    this.tryMe(execThunk(`git clone ${oldRepo} $(pwd)/repos/${repoName}`)) 
  }

  matchOldRepoToNew(oldRepo, newRepoList) {
    let newRepo = newRepoList.find(rep => {
      let old = this.splitName(oldRepo);
      return rep.includes(old);
    })
    return newRepo;
  }


  addRemote(oldRepo, newRepo) {
    let repoName = this.splitName(oldRepo)

    console.log(`adding remote to repo: ${repoName}`);
    let dirPath = `$(pwd)/repos/${oldRepo}`;
    this.tryMe(execThunk(`cd ${dirPath} && git pull origin *:*`))
    this.tryMe(execThunk(`cd ${dirPath} && git remote add upstream ${this.remote(newRepo)}`))
    this.tryMe(execThunk(`cd ${dirPath} && git push -u upstream *:*`))
  }

  cacheCredentials() {
    this.tryMe(execThunk(`git config --global credential.helper cache`))
  }

  tryMe (tryThis) {
    try {
      tryThis()
    } catch (error) {
      console.error(`☠️  PID ${error.pid} exited with status code ${error.status}`)
    }
  }

  splitName(repo) {
    let arr = repo.split('/')
    const name = arr[arr.length - 1];
    return name;
  }
}

const makeit = new MigrateRepo()

