from flask import Flask, redirect, render_template_string, request, url_for
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///students.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


# Database Model
class Student(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  name = db.Column(db.String(100), nullable=False)
  grade = db.Column(db.String(20), nullable=False)
  subject = db.Column(db.String(100), nullable=False)

  def __repr__(self):
    return f'<Student {self.name}>'


# HTML Template embedded in Python for a single-file setup
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Student Management System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f4f4f9; color: #333; }
        h1, h2 { color: #0056b3; }
        form { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px; width: 400px; }
        input, select { width: 100%; padding: 8px; margin: 8px 0 16px 0; display: inline-block; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { background-color: #0056b3; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
        button:hover { background-color: #004095; }
        table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #0056b3; color: white; }
        tr:hover { background-color: #f1f1f1; }
        .delete-btn { color: red; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Student Management System</h1>
    
    <form action="/add" method="POST">
        <h2>Add New Student</h2>
        <label>Student Name:</label>
        <input type="text" name="name" required>
        
        <label>Grade / Level:</label>
        <input type="text" name="grade" required>
        
        <label>Primary Subject:</label>
        <input type="text" name="subject" required>
        
        <button type="submit">Add Student</button>
    </form>

    <h2>Registered Students</h2>
    <table>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Grade</th>
            <th>Subject</th>
            <th>Action</th>
        </tr>
        {% for student in students %}
        <tr>
            <td>{{ student.id }}</td>
            <td>{{ student.name }}</td>
            <td>{{ student.grade }}</td>
            <td>{{ student.subject }}</td>
            <td><a class="delete-btn" href="/delete/{{ student.id }}">Delete</a></td>
        </tr>
        {% else %}
        <tr>
            <td colspan="5" style="text-align: center;">No students recorded yet.</td>
        </tr>
        {% endfor %}
    </table>
</body>
</html>
"""


@app.route('/')
def index():
  students = Student.query.all()
  return render_template_string(HTML_TEMPLATE, students=students)


@app.route('/add', methods=['POST'])
def add_student():
  name = request.form.get('name')
  grade = request.form.get('grade')
  subject = request.form.get('subject')

  if name and grade and subject:
    new_student = Student(name=name, grade=grade, subject=subject)
    db.session.add(new_student)
    db.session.commit()

  return redirect(url_for('index'))


@app.route('/delete/<int:id>')
def delete_student(id):
  student = Student.query.get_or_404(id)
  db.session.delete(student)
  db.session.commit()
  return redirect(url_for('index'))


if __name__ == '__main__':
  with app.app_context():
    db.create_all()  # Creates the SQLite database file automatically
  app.run(debug=True)