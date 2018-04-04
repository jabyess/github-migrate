const exec = require('child_process').execSync
const execThunk = command => _ => exec(command)
const axios = require('axios')
const links = require('./links.json')

const ORG_AGNOSTIC_SEPARATOR = 's/' // splits after GH org names ending in s, like ga-wdi-lessons/ and ga-wdi-exercises/
const repos = links.map(link => link.split(ORG_AGNOSTIC_SEPARATOR)[1])
const orgRepos = links.map(link => link.replace('https://git.generalassemb.ly/', ''))
const TARGET_ORG_NAME = 'dc-wdi-node-express'

// repos.forEach(createRemoteRepo)
// repos.forEach(privatize)
// links.forEach(tryClone)
repos.forEach(tryPush)


function remote (repo) {
  return `https://git.generalassemb.ly/${TARGET_ORG_NAME}/${repo}`
}

function tryClone (repo) {
  // tryMe(execThunk(`git clone --mirror git://github.com/ga-wdi-lessons/${repo} ${repo}/.git && cd ${repo} && git config --unset core.bare && git config receive.denyCurrentBranch updateInstead && git checkout master`))
  tryMe(execThunk(`cd repos/ && git clone ${repo}`))
}

function tryPush (repo) {
  let dirPath = `repos/${repo}`
  tryMe(execThunk(`cd ${dirPath} && git pull origin *:*`))
  tryMe(execThunk(`cd ${dirPath} && git remote add upstream ${remote(repo)}`))
  tryMe(execThunk(`cd ${dirPath} && git push -u upstream *:*`))
}

function privatize (repo) {
  axios
  .patch(`https://git.generalassemb.ly/api/v3/repos/${TARGET_ORG_NAME}/${repo}?access_token=${process.env.token}`, {private: true})
  .then(res => console.log(`${res.data.url} updated to private`))
  .catch(error => console.error(error.response.data))
}

function createRemoteRepo (repo) {
  const postURL = `https://git.generalassemb.ly/api/v3/orgs/${TARGET_ORG_NAME}/repos?access_token=${process.env.token}`
  axios
  .post(postURL, {name: repo})
  .then(res => {
    console.log(`${res.data.url} created`)
    tryPush(repo)
  })
  .catch(error => console.error(error.response.data))
}

function nuke (repo) {

}

function tryMe (tryThis) {
  try {
    tryThis()
  } catch (error) {
    console.error(`☠️  PID ${error.pid} exited with status code ${error.status}`)
  }
}