<?xml version="1.0" encoding="WINDOWS-1251" ?>
<trigger_library version="1.02">

  <trigger last_changed="������� �.�." name="��������������������������������" responsible="Buravlevms">
    <definition>
      <language>PLPGSQL</language>
      <body>DECLARE
   clientID integer := OLD."������";
   schemaName text := null;
BEGIN
   EXECUTE 'DELETE FROM "�����������������" WHERE "������������" = $1."@������������";' using OLD;
   EXECUTE 'DELETE FROM "��������������������" WHERE "������������" = $1."@������������";' using OLD;
   RETURN NULL;
END;</body>
    </definition>
  </trigger>

</trigger_library>
