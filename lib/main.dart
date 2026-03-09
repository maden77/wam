import 'package:flutter/material.dart';

void main() => runApp(NotesApp());

class NotesApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(home: NotesScreen());
  }
}

class NotesScreen extends StatefulWidget {
  @override
  _NotesScreenState createState() => _NotesScreenState();
}

class _NotesScreenState extends State<NotesScreen> {
  List<String> notes = [];
  final TextEditingController _controller = TextEditingController();

  void addNote() {
    if (_controller.text.isNotEmpty) {
      setState(() {
        notes.add(_controller.text);
        _controller.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Buku Catatan Saya")),
      body: ListView.builder(
        itemCount: notes.length,
        itemBuilder: (context, index) => ListTile(
          title: Text(notes[index]),
          trailing: IconButton(icon: Icon(Icons.delete), onPressed: () => setState(() => notes.removeAt(index))),
        ),
      ),
      bottomSheet: Padding(
        padding: EdgeInsets.all(10),
        child: Row(
          children: [
            Expanded(child: TextField(controller: _controller, decoration: InputDecoration(hintText: "Tulis catatan..."))),
            IconButton(icon: Icon(Icons.add), onPressed: addNote)
          ],
        ),
      ),
    );
  }
}
