const gulp = require('gulp');
const zip = require('gulp-zip');
const log = require('fancy-log');
const fs  = require('fs');
const argv = require('yargs').argv;
var Client = require('ssh2').Client;
var conn = new Client();
const env = argv.env || 'release';

const config = {
  host: '',
  port: 22,
  username: '',
  password: ''
};

const shellExecList = [
  'exit\n',
];

const fileZipName = `release-${env}-zip.zip`;
const fileZipPath = '../dist/zip/' + fileZipName;

const params = {file: fileZipPath, target: '/home/frontend/a.zip'};

function Ready() {
  log('release Ready==>>>');
  conn.on('ready', function() {
    log('Client :: ready success');
    UploadFile(conn, params);
  }).connect(config);
}

function Shell(conn) {
  conn.shell(function(err, stream) {
    if (err) {
      throw err;
    }
    stream.on('close', function() {
      log('Stream :: close');
      conn.end();
    }).on('data', function(data) {
      log('Stdout: ' + data);
    });
    stream.end(shellExecList.join(''));
  });
}

/**
 * 上传文件
 * @param conn
 * @param params
 * @constructor
 */
function UploadFile(conn, params) {
  const file = params.file;
  const target = params.target;
  if (!conn) {
    return;
  }
  conn.sftp(function(err, sftp) {
    if (err) {
      throw err;
    }
    sftp.fastPut(file, target, {}, function(err, result) {
      if (err) {
        // console.log(chalk.red(err.message));
        throw err;
      }
      log('Please wait while uploding...');
      Shell(conn);
    });
  });
}

gulp.task('zip', function() {
  fs.unlinkSync(fileZipPath);
  return gulp
    .src(`../dist/**/*`)
    .pipe(zip(fileZipName))
    .pipe(gulp.dest(`../dist/zip`));
});

gulp.task('connect', function(done) {
  Ready();
  done();
});

gulp.task('release', gulp.series( [ 'zip', 'connect' ] ));