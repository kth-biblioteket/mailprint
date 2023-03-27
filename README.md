# KTH Bibliotekets Mailprint

En tjänst som hanterar utskrifter främst från bibliotekssystemet Alma.

## Installing / Getting started

```shell
git clone repo
docker build
docker compose up -d
```

### Initial Configuration

Skapa environment fil med innehåll enligt nedan

#### Environment file
```txt
HB_PRINTER_NAME=ECE_KTHB_BACKOFFICE
HB_PRINTER_ADDRESS=print05.ug.kth.se
HB_PRINTER_MAILPRINT_NAME=alma-hb
TELGE_PRINTER_ADDRESS=socket://192.168.71.103:9100/
TELGE_PRINTER_MAILPRINT_NAME=alma-telge
WALKIN_PRINTER_MAILPRINT_NAME=hb-walk-in
PRINTER_LOCATION=Office
PRINTER_DESCRIPTION="My printer"
PRINTFORMAT=A5
PRINTFORMAT_INVOICE=A4
PRINTFORMAT_TELGE=A5
PRINTMARGINTOP=1.00cm
PRINTMARGINRIGHT=1.00cm
PRINTMARGINBOTTOM=1.00cm
PRINTMARGINLEFT=1.00cm
USER_DOMAIN=ug.kth.se
IMAP_USER=xxxxxx
IMAP_PASSWORD=xxxxxx
IMAP_HOST=webmail.kth.se
PRINTER_USER=xxxxxx
PRINTER_PASSWORD=xxxxxx
MAILDIR=/maildir
PRINTED_FOLDER=printed
ERROR_FOLDER=error
PRINT_PHYSICAL=true
PRINT_KEY=xxxxxx
SERVER_OS=linux
ENVIRONMENT=production
```

## Developing

### Building

```shell
git push origin main / git push origin ref
```

### Deploying / Publishing

En github action finns som skapar en ny image vid push till ref/main.

```shell
docker compose down
docker compose pull
docker compose up -d
```

## Features

Skriver ut mail från bibliotekssystemet Alma
* Skriva ut slippar

## Contributing

## Links

- Project homepage: https://your.github.com/awesome-project/
- Repository: https://github.com/your/awesome-project/

## Licensing

## Cups används för utskrifter
    https://github.com/kaneymhf/docker-cups
    lp -d alma-hb-walkin walkin.txt -o job-hold-until=indefinite

## Alma letters style.xls
```xml
<meta name="kthb">
  <xsl:attribute name="printer">
    <xsl:value-of select="notification_data/receivers/receiver/printer/code"/>
  </xsl:attribute>
  <xsl:attribute name="printkey">
      xxxxxx
  </xsl:attribute>
</meta>
```

