package foo;

import java.io.IOException;
import java.util.HashSet;
import java.util.Random;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;

import com.google.appengine.api.datastore.Entity;

@WebServlet(name = "FbServlet", urlPatterns = { "/fb" })
public class FriendBlockServlet extends HttpServlet {

	/**
	 *
	 */
	private static final long serialVersionUID = 1L;

	@Override
	public void doGet(final HttpServletRequest request, final HttpServletResponse response) throws IOException {

	response.setContentType("text/html");
	response.setCharacterEncoding("UTF-8");

	final Random r = new Random();

	// Create users
	for (int i = 0; i < 500; i++) {
		final Entity e = new Entity("Friend", "f" + i);
		e.setProperty("firstName", "first" + i);
		e.setProperty("lastName", "last" + i);
		e.setProperty("age", r.nextInt(100) + 1);


		final DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
		datastore.put(e);
		response.getWriter().print("<li> created friend:" + e.getKey() + "<br>" );


		for (int j=0;j<10;j++) {
		// Create user friends
			final Entity amis = new Entity("Amis","a"+j,e.getKey());
			final HashSet<String> fset = new HashSet<String>();
			while (fset.size() < 200) {
				fset.add("f" + r.nextInt(500));
			}
			amis.setProperty("friends", fset);
			datastore.put(amis);
			response.getWriter().print("<li> created amis:"+ amis.getKey() + "<br>" );
		}

	}
}
}