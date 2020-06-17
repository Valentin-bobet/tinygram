package entities;

public class Post {
	public String owner;
	public String body;
	public String url;
	public String name;
	public String id;

	public Post() {}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}
}
