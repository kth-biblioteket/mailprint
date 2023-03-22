# KTH Bibliotekets tjänst för att hantera utskrifter via mail

## Skrivare
    Huvudbiblioteket kontor plan3 = "\\PRINT05\KTHB_DOK_AF_MPC2550"
    Huvudbiblioteket backoffice = "\\PRINT05\ECE_KTHB_BACKOFFICE"
    sudo lpadmin -p alma-hb -v smb://user:password@ug.kth.se/print05.ug.kth.se/ECE_KTHB_BACKOFFICE -E
    Kista = "\\print06\ICT-Bibliotek"
    sudo lpadmin -p alma-kista -v smb://user:password@ug.kth.se/print06.ug.kth.se/ICT-Bibliotek -E
    Telge = "192.168.71.103"
    sudo lpadmin -p alma-telge -v socket://192.168.71.103:9100/ -E
    (sudo lpadmin -p alma-telge -v ipp://192.168.71.103/ipp/print -E -m everywhere)
    Ta bort:
    sudo lpadmin -x skrivare
    Lista:
    lpstat -t
    Enable:
    cupsenable skrivare

    lp -d alma-hb-walkin walkin.txt -o job-hold-until=indefinite

### Docker
En github action finns som skapar en ny image
docker compose pull && docker compose up -d
https://github.com/kaneymhf/docker-cups

#### Alma letters style.xls
```xml
<meta name="description">
  <xsl:attribute name="printer">
    <xsl:value-of select="notification_data/request/note"/>
  </xsl:attribute>
</meta>
```

##### Environment-fil
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
SERVER_OS=windows
ENVIRONMENT=production
```
