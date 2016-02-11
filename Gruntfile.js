module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch')
    grunt.loadNpmTasks('grunt-open');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    port: 8081,
                    base: './'
                }
            }
        },
        open: {
            dev: {
                path: 'http://localhost:8081/index.html'
            }
        },
        watch: {
            files: '**/*.js'/*,
            tasks: ['typescript']*/
        },
    });

    grunt.registerTask('default', ['connect', 'open', 'watch']);

}
