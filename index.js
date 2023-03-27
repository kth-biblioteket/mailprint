require('dotenv').config({ path: 'mailprint.env' })
const fs = require('fs');
const path = require('path');
const simpleParser = require('mailparser').simpleParser;
const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const process = require("process");
const winston = require('winston');
const Imap = require('imap');

const maildirPath = process.env.MAILDIR;
const timezoned = () => {
    var options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZone: 'Europe/Stockholm'
    };
    return new Date().toLocaleString('sv-SE', options);
};

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: timezoned
          }),
        winston.format.json()
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.File({ filename: 'combined.log' })
    ]
});

function cmd(...command) {
    let p = exec(command[0], command.slice(1));
    return new Promise((resolve, reject) => {
        p.stdout.on("data", (x) => {
            process.stdout.write(x.toString());
        });
        p.stderr.on("data", (x) => {
            reject(x)
        });
        p.on("exit", (code) => {
            resolve(code);
        });
    });
}

async function main() {
    let outgoing_mail_message = {}
    outgoing_mail_message.text = `Alma Print service started`;
    outgoing_mail_message.html = `<p>Alma Print service started</p>`;
    //sendemail(outgoing_mail_message);
    let incomingmailcontent = "";
    logger.log('info',"KTH BIbliotekets Mailprint service startad");
    console.log("Mailprint service running...");
    let printer = process.env.WALKIN_PRINTER_MAILPRINT_NAME;
    if(process.env.SERVER_OS == "linux") {
        try {
            await cmd("cupsd");
            await cmd(`lpadmin -p ${process.env.HB_PRINTER_MAILPRINT_NAME} -v smb://${process.env.PRINTER_USER}:${process.env.PRINTER_PASSWORD}@${process.env.USER_DOMAIN}/${process.env.HB_PRINTER_ADDRESS}/${process.env.HB_PRINTER_NAME} -E`);
            await cmd(`lpadmin -p ${process.env.TELGE_PRINTER_MAILPRINT_NAME} -v ${process.env.TELGE_PRINTER_ADDRESS} -E`);
            await cmd(`lpadmin -p ${process.env.WALKIN_PRINTER_MAILPRINT_NAME} -v smb://${process.env.PRINTER_USER}:${process.env.PRINTER_PASSWORD}@${process.env.USER_DOMAIN}/${process.env.HB_PRINTER_ADDRESS}/${process.env.HB_PRINTER_NAME} -E -o job-hold-until=indefinite`);
            
            console.log("This must happen last.");
        } catch(e) {
            logger.log('error', `${e}`)
            console.log(e)
            return;
        }
    }

    const imap = new Imap({
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASSWORD,
        host: process.env.IMAP_HOST,
        port: 993,
        tls: true,
        authTimeout: 3000
    });  

    imap.once('ready', () => {
        console.log('Connected to IMAP server');
        imap.openBox('INBOX', false, (err, box) => {
            if (err) {
                logger.log('error', `${err}`)
                console.error(err);
            }
            imap.on('mail', (numNewMsgs) => {
                if (err) {
                    logger.log('error', `${err}`)
                    console.error(err);
                    return;
                }
                imap.search(['UNSEEN'], (err, uids) => {
                    if (err) {
                        logger.log('error', `${err}`)
                        console.log(err)
                        return;
                    }
                    for (const uid of uids) {
                        const fetchOptions = { bodies: '' };
                        const msgStream = imap.fetch(uid, fetchOptions);
                        msgStream.on('message', (msg) => {
                            let email = '';
                            msg.once('body', async(stream, info) => {
                                outgoing_mail_message.text = ``;
                                outgoing_mail_message.html = ``;
                                email = await simpleParser(stream);
                                /*
                                if (email.html.indexOf(process.env.PRINT_KEY) !== -1) {
                                    logger.log('info', "Key is valid");
                                } else {
                                    logger.log('error', "Key is not valid from sender: " + email.from);
                                    console.log("Key not valid")
                                    //Flytta mailet till error-folder
                                    const moveTo = process.env.ERROR_FOLDER;
                                    imap.move(uid, moveTo, function(err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        logger.log('info', 'mail ' + uid + ' moved to ' + printer);
                                    });
                                    return;
                                }
                                */
                                //Se till att låntagarens barcode kommer med på fakturautskriften
                                if(email.subject == "Lost Items Bill" || email.subject == "Lost Item Bill" || email.subject == "Räkning för borttappat material") {
                                    email.html = email.html.replace("</head>",`<style>
                                            @font-face {
                                                font-family: Code39AzaleaFont;
                                                src: url('/app/fonts/Code39Azalea.ttf') format('truetype');
                                                font-weight: normal;
                                                font-style: normal;
                                            }
                                            .patronbarcode, .itembarcode, #itembarcode,
                                            .patronbarcode1, .itembarcode1, #itembarcode1 {
                                                display:block !important;
                                                font-family:Code39AzaleaFont; 
                                                font-size:40px;
                                                visibility: visible !important;
                                            }
                                            .patronbarcodenumbers,
                                            .patronbarcodenumbers1 {
                                                display:block !important;
                                            }
                                        </style>
                                    </head>`);
                                    printformat = process.env.PRINTFORMAT_INVOICE;
                                }
                                //Definiera pappersstorlek beroende på typ av letter
                                if(email.subject == "Resource Request" 
                                || email.subject == "Transit" 
                                || email.subject == "Cash Receipt" 
                                || email.subject == "Kvitto") {
                                    printformat = process.env.PRINTFORMAT;
                                    if(email.to.text == process.env.TELGEEMAIL) {
                                        printformat = process.env.PRINTFORMAT_TELGE //Telge har bara ett fack i sin skrivare för närvarande.
                                    }
                                }
                                //Skapa html-fil från mailet
                                if(email.html) {
                                    incomingmailcontent = email.html;
                                } else {
                                    incomingmailcontent = email.text
                                }
                                const filename = `email-${Date.now()}`;
                                fs.writeFile(maildirPath + '/' + filename +  '.html', incomingmailcontent, function(error){ 
                                    if (error) {
                                        logger.log('error',`watcher.on.add.writefile: ${error}`)
                                        outgoing_mail_message.text = `Watcher error: ${error}`;
                                        outgoing_mail_message.html = `<p>Watcher error: ${error}</p>`;
                                    }
                                });
                                var printmargin = { 
                                    top: process.env.PRINTMARGINTOP, 
                                    right: process.env.PRINTMARGINRIGHT, 
                                    bottom: process.env.PRINTMARGINBOTTOM, 
                                    left: process.env.PRINTMARGINLEFT
                                };
                    
                                try {
                                    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
                                    const page = await browser.newPage();
                                    page.on('error', error=> {
                                        logger.log('error',`watcher.on.add.source.on.open.browser.page.on.error: ${error}`)
                                        outgoing_mail_message.text = `chromium browser error at page: ${error}`;
                                        outgoing_mail_message.html = `<p>chromium browser error at page: ${error}</p>`;
                                    });
                                    
                                    page.on('pageerror', error=> {
                                        logger.log('error',`watcher.on.add.source.on.open.browser.page.on.pagerror: ${error}`)
                                        outgoing_mail_message.text = `chromium pageerror: ${error}`;
                                        outgoing_mail_message.html = `<p>chromium pageerror: ${error}</p>`;
                                    })

                                    await page.setContent(incomingmailcontent);
                                    //await page.goto('file://' + maildirPath + '/' + filename + '.html');
                                    //Skapa pdf-fil
                                    await page.pdf({ format: "a5", path: maildirPath + '/' + filename + '.pdf', margin: printmargin });
                                    await browser.close();

                                    let user = email.from
                                    let hold_job = '-o job-hold-until=indefinite'
                                    //Skriv ut på den skrivare som finns definierad i almaletter via
                                    // meta tag med attribute printer
                                    const hb_regex = /printer="MAINPRINT"/;
                                    const telge_regex = /printer="TEPRINT"/;
                                    if (hb_regex.test(email.html)) {
                                        printer = process.env.HB_PRINTER_MAILPRINT_NAME
                                        user = 'alma@ece.kth.se'
                                        hold_job = ''

                                    }
                                    if (telge_regex.test(email.html)) {
                                        printer = process.env.TELGE_PRINTER_MAILPRINT_NAME
                                        user = 'alma@ece.kth.se'
                                        hold_job = ''
                                    }
                                    if(process.env.SERVER_OS == "linux" && process.env.PRINT_PHYSICAL == 'true') {
                                        exec('lp -d ' + printer + ' ' + maildirPath + '/' + filename + '.pdf' + ' -U ' + user + ' ' + hold_job, (error, stdout, stderr) => {
                                            if (error) {
                                                logger.log('error', `${error}`)
                                                console.error(`exec error: ${error}`);
                                                return;
                                            }
                                            console.log(`stdout: ${stdout}`);
                                            logger.log('info', maildirPath + '/' + filename + '.pdf' +' printer to ' + printer);
                                        });
                                    }
                                    //Markera mailet som läst
                                    imap.addFlags(uid, ['\\Seen'], function (err) {
                                        if (err) {
                                            logger.log('error', `${err}`)
                                            console.log(err);
                                        }
                                    });
                                    //Flytta mailet till printed-folder
                                    const moveTo = process.env.PRINTED_FOLDER;
                                    imap.move(uid, moveTo, function(err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        logger.log('info', 'mail ' + uid + ' moved to ' + printer);
                                    });                                    
                                } catch (e) {
                                    logger.log('error',`: ${e}`)
                                    console.log(e)
                                }
                            });
                        })
                    }
                });
            });
        });
    });
    imap.connect();

}

main()