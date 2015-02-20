<?xml version="1.0" encoding="WINDOWS-1251"?>
<trigger_library version="1.02">

  <trigger last_changed="������� �.�." name="�����������������������" responsible="������� �.�.">
    <definition>
      <language>PLPGSQL</language>
      <body>DECLARE
   idLink integer;
BEGIN
   IF TG_OP = 'INSERT' THEN
      SELECT "@�����������������" INTO idLink
         FROM "�����������������"
         WHERE "������������" = NEW."������������"
            -- ���� ������� � ��������� ������� �����, �� ����� ��������� ��� ��� ��������� ������� �������� ����
            AND ( NEW."�����������" IS NOT NULL AND "�����������" != NEW."�����������"
            -- ���� ������� � ��������� �������������, �� ��� �������� ����, �� ����� ��������� ����� ��� ���� ��������� ������� ����
               OR NEW."�����������" IS NULL AND "�����������" IS NOT NULL );
      IF idLink IS NOT NULL THEN
         RAISE EXCEPTION '� ������� ������������ ��� ���� ������� � ������� �������� ����!';
      END IF;
   END IF;
   RETURN NEW;
END</body>
    </definition>
  </trigger>

</trigger_library>
