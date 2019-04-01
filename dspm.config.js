module.exports = (project) => {
  project.getTask('build')
    .dependsOn('clean');

  project.getTask('package')
      .dependsOn('build');
};
