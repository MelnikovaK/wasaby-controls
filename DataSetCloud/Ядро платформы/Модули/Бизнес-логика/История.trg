<?xml version="1.0" encoding="WINDOWS-1251"?>
<trigger_library version="1.02">

  <trigger last_changed="������ �.�." name="DenyDelete" responsible="������ �.�.">
    <definition>
      <language>PLPGSQL</language>
      <body>begin
   raise exception '��������� �������� ������ �������!';
end</body>
    </definition>
  </trigger>

  <trigger last_changed="������ �.�." name="DenyUpdate" responsible="������ �.�.">
    <definition>
      <language>PLPGSQL</language>
      <body>begin
   raise exception '��������� ��������� ������ �������!';
end</body>
    </definition>
  </trigger>

</trigger_library>
