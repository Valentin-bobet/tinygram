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

@WebServlet(name = "SearchTimelineQuery", urlPatterns = { "/searchTimeline" })
public class SearchTimelineQuery extends HttpServlet {

    /**
	 *
	 */
	private static final long serialVersionUID = 1L;

	@Override
    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String search = request.getParameter("email");
		response.setContentType("application/json");
        PrintWriter out = response.getWriter();

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
        Query friendsQuery = new Query("Friendship").setFilter(
            new FilterPredicate("askingUser", FilterOperator.EQUAL, search)
        );
        PreparedQuery preparedFriendsQuery = datastore.prepare(friendsQuery);
        List<Entity> friendsQueryResult = preparedFriendsQuery.asList(FetchOptions.Builder.withDefaults());

		String postsJson="{}";
		if(!friendsQueryResult.isEmpty()) {
			for (Entity friendship : friendsQueryResult) {
                DatastoreService datastore_2 = DatastoreServiceFactory.getDatastoreService();
                Query userQuery = new Query("tinyUser").setFilter(
                        new FilterPredicate("email", FilterOperator.EQUAL, friendship.getProperty("targetUser"))
                        );
                PreparedQuery preparedUserQuery = datastore.prepare(userQuery);
                List<Entity> userQueryResult = preparedUserQuery.asList(FetchOptions.Builder.withDefaults());
                for(Entity tinyUser : userQueryResult) {
                    postsJson = "{\"tinyUser\": [";
                    postsJson += "\"email\":\""+tinyUser.getProperty("email")+"\",";
                    postsJson += "\"name\":\""+tinyUser.getProperty("name")+"\",";
                    postsJson += "\"url\":\""+tinyUser.getProperty("url")+"\",";
                    postsJson += "\"posts\": [";
                    DatastoreService datastore_3 = DatastoreServiceFactory.getDatastoreService();
                    Query postQuery = new Query("post").setFilter(
                            new FilterPredicate("owner", FilterOperator.EQUAL, tinyUser.getProperty("targetUser"))
                            );
                    PreparedQuery preparedPostQuery = datastore.prepare(postQuery);
                    List<Entity> postQueryResult = preparedPostQuery.asList(FetchOptions.Builder.withDefaults());
                    if(!postQueryResult.isEmpty()) {
                        for(Entity post : postQueryResult) {
                            postsJson += "{\"url\":\""+post.getProperty("url")+"\",";
                            postsJson += "\"url\":\""+post.getProperty("body")+"\",";
                            postsJson += "\"url\":\""+post.getProperty("date")+"\",";
                            postsJson += "\"url\":\""+post.getProperty("likec")+"\"}";
                        }
                    }
                    postsJson += "]";
                }
                postsJson += "}";
            }
        }
		out.print(postsJson);
        out.flush();
    }
}