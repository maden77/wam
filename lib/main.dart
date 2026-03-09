import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() => runApp(NotesApp());

class NotesApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: NotesScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class NotesScreen extends StatefulWidget {
  @override
  _NotesScreenState createState() => _NotesScreenState();
}

class _NotesScreenState extends State<NotesScreen> {
  List<String> notes = [];
  final TextEditingController _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadNotes(); // Ambil data saat aplikasi pertama kali dibuka
  }

  // Fungsi mengambil data dari HP
  _loadNotes() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    setState(() {
      notes = prefs.getStringList('my_notes') ?? [];
    });
  }

  // Fungsi menyimpan data ke HP
  _saveNotes() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('my_notes', notes);
  }

  void addNote() {
    if (_controller.text.isNotEmpty) {
      setState(() {
        notes.add(_controller.text);
        _controller.clear();
      });
      _saveNotes(); // Simpan setiap kali nambah
    }
  }

  void removeNote(int index) {
    setState(() {
      notes.removeAt(index);
    });
    _saveNotes(); // Simpan setiap kali hapus
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Buku Catatan Saya")),
      body: notes.isEmpty 
          ? Center(child: Text("Belum ada catatan"))
          : ListView.builder(
              itemCount: notes.length,
              itemBuilder: (context, index) => ListTile(
                title: Text(notes[index]),
                trailing: IconButton(
                  icon: Icon(Icons.delete, color: Colors.red),
                  onPressed: () => removeNote(index),
                ),
              ),
            ),
      bottomSheet: Container(
        padding: EdgeInsets.all(16),
        color: Colors.white,
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                decoration: InputDecoration(hintText: "Tulis catatan...", border: OutlineInputBorder()),
              ),
            ),
            SizedBox(width: 8),
            FloatingActionButton(
              onPressed: addNote,
              child: Icon(Icons.add),
            )
          ],
        ),
      ),
    );
  }
}
