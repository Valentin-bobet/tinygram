package foo;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Arrays;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.PropertyProjection;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.CompositeFilterOperator;
import com.google.appengine.api.datastore.Query.CompositeFilter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;

@WebServlet(name = "SearchUserQuery", urlPatterns = { "/search" })
public class SearchUserQuery extends HttpServlet {

    /**
	 *
	 */
	private static final long serialVersionUID = 1L;

	@Override
    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String search = request.getParameter("search");
        String me = request.getParameter("me");

        response.setContentType("text/html");
        PrintWriter out = response.getWriter();
        out.println("<html>");
        out.println("<body>");
        out.println("<h1>Search results :</h1>");
        out.println("</body>");
        out.println("</html>");

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
        Query searchQuery = new Query("tinyUser").setFilter(
        		new FilterPredicate("email", FilterOperator.EQUAL, search));
        PreparedQuery preparedSearchQuery = datastore.prepare(searchQuery);
		List<Entity> searchQueryResult = preparedSearchQuery.asList(FetchOptions.Builder.withDefaults());
		if(searchQueryResult.isEmpty()) {
			out.println("<p>Sorry, no result found</p>");
		} else {
			out.print("<li> Result:" + searchQueryResult.size() + "<br>");

			for (Entity entity : searchQueryResult) {
				out.print("<li>" + entity.getProperty("email"));
				
				DatastoreService datastore_2 = DatastoreServiceFactory.getDatastoreService();
		        Query friendQuery = new Query("Friendship").setFilter(CompositeFilterOperator.and(
		        		new FilterPredicate("askingUser", FilterOperator.EQUAL, me),
		        		new FilterPredicate("targetUser", FilterOperator.EQUAL, search)
		        		));
		        PreparedQuery preparedFriendQuery = datastore_2.prepare(friendQuery);
				List<Entity> friendQueryResult = preparedFriendQuery.asList(FetchOptions.Builder.withDefaults());
				
				if (friendQueryResult.isEmpty()) {
					
					out.print("Pas ami");
					
				} else {
					out.print("Ami");
				}
				
			}
		}
    }
}