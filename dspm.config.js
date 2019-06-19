module.exports = (project) => {
  project.getTask('build')
    .dependsOn('clean');

  project.getTask('package')
    .fromFile('package.json', {
      version: process.env.TRAVIS_TAG || 'local',
    })
    .dependsOn('build');

  project.getTask('publish')
    .token(process.env.TRAVIS_NPM_TOKEN);
};
