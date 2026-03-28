const XLSX = require('xlsx');

const data = [
  ['fatura_no','marka','yil','musteri_adi','dosya_no','plaka','yedek_parca_net','iscilik_net','genel_toplam','fatura_tarihi','odenen_tutar'],
  ['FTR-2024-001','OPEL',2019,'Ahmet Yilmaz','DOS-001','34ABC123',4500,2800,7300,'2024-01-10',7300],
  ['FTR-2024-002','PEUGEOT',2020,'Mehmet Kaya','DOS-002','06XYZ789',6200,3100,9300,'2024-01-15',5000],
  ['FTR-2024-003','HYUNDAI',2021,'Ayse Demir','DOS-003','35KLM456',3800,2200,6000,'2024-01-22',0],
  ['FTR-2024-004','OPEL',2018,'Fatma Celik','DOS-004','34DEF321',5100,2900,8000,'2024-02-05',8000],
  ['FTR-2024-005','DIGER',2017,'Ali Sahin','DOS-005','07PQR654',2900,1800,4700,'2024-02-12',0],
  ['FTR-2024-006','PEUGEOT',2022,'Zeynep Arslan','DOS-006','34GHI987',7800,4200,12000,'2024-02-20',12000],
  ['FTR-2024-007','HYUNDAI',2020,'Mustafa Ozkan','DOS-007','06STU147',4100,2500,6600,'2024-03-08',3300],
  ['FTR-2024-008','OPEL',2019,'Elif Yildiz','DOS-008','35VWX258',5600,3400,9000,'2024-03-15',9000],
  ['FTR-2024-009','DIGER',2016,'Hasan Koc','DOS-009','34YZA369',3200,2100,5300,'2024-03-25',0],
  ['FTR-2024-010','HYUNDAI',2023,'Selin Ak','DOS-010','07BCD741',8900,4800,13700,'2024-04-03',13700],
  ['FTR-2024-011','OPEL',2021,'Burak Ozturk','DOS-011','34JKL852',6300,3600,9900,'2024-04-18',9900],
  ['FTR-2024-012','PEUGEOT',2019,'Cansu Bulut','DOS-012','06MNO963',5400,2700,8100,'2024-05-07',4000],
  ['FTR-2024-013','HYUNDAI',2022,'Emre Yilmaz','DOS-013','35PQR174',7200,4100,11300,'2024-05-14',11300],
  ['FTR-2024-014','DIGER',2018,'Gul Kaplan','DOS-014','34STU285',2600,1600,4200,'2024-05-28',0],
  ['FTR-2024-015','OPEL',2020,'Serkan Demir','DOS-015','07VWX396',4800,3000,7800,'2024-06-10',7800],
];

const ws = XLSX.utils.aoa_to_sheet(data);
ws['!cols'] = [
  {wch:14},{wch:10},{wch:6},{wch:16},{wch:10},{wch:10},
  {wch:16},{wch:14},{wch:14},{wch:14},{wch:14}
];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Faturalar');
XLSX.writeFile(wb, 'C:/Users/idemi/Desktop/ornek_faturalar.xlsx');
console.log('Tamam - Dosya masaustune kaydedildi');
